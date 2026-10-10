import {
  ScopeType, Formatter, Language, EffectiveFormatters, FormatOptions, InterpolationOptions,
  NestedKeyOf, NestedKeyOfObj, PathValue, TranslationObjectFor, PluralKeys, DeepMergeResources, 
  TagInterpolationOptions, PluralParamsFor, TArgs, TResult, Subscriber, Unsubscribe, ResourceLoader
} from "./types";
import { type DefaultFormatters, defaultFormatters } from "./formatters";

/**
 * Configuration for the LocL instance.
 * @template T - The type of the resources object.
 * @template Fallback - The fallback language.
 * @template F - The type of the custom formatters.
 */
export interface LocLConfig<T extends Record<string, any>, Fallback extends keyof T & string, F extends Record<string, Formatter> = {}> {
  /** An object containing all language translations. */
  resources: T;
  /** The initial language to use. */
  language?: (keyof T & string) | string;
  /** The default language to use if a translation is missing. */
  fallbackLanguage: Fallback;
  /** Narrows the translation object to a specific scope(s) (e.g., "common"). */
  scope?: ScopeType<T, Fallback>;
  /** A map of custom formatting functions. */
  formatters?: F;
  /** Whether to include the built-in formatters. Defaults to `true`. */
  useDefaultFormatters?: boolean;
  /** Enables warnings for missing keys and scopes. Defaults to `false`. */
  devMode?: boolean;
  /** Enables caching of scopes and proxies. Defaults to `true`. */
  useCache?: boolean;
  /** Default async loader function for lazy loading namespaces */
  loader?: ResourceLoader;
}

/**
 * The main class for handling translations.
 * It provides methods for translating keys, handling plurals, and formatting values.
 * @template T - The type of the resources object.
 * @template Fallback - The fallback language.
 * @template S - The type of the scope.
 * @template F - The type of the custom formatters.
 * @template UseDefaultFormatter - Whether to use the default formatters.
 */
export class LocL<
  T extends Record<string, any>,
  Fallback extends keyof T & string,
  S extends ScopeType<T, Fallback> = undefined,
  F extends Record<string, Formatter> = {},
  UseDefaultFormatter extends boolean = true
> {
  private readonly rootInstance: LocL<T, Fallback, any, F, UseDefaultFormatter> = this;
  private config: LocLConfig<T, Fallback>;
  private resources: T & Record<string, any>;
  private language: Language<T>;
  private fallbackLanguage: Language<T>;
  private scope?: S;
  private formatters: EffectiveFormatters<F, UseDefaultFormatter>;
  private cache: Map<string, object | LocL<T, Fallback, any> | undefined> = new Map();
  private proxyCache = new WeakMap<object, any>();
  private pluralRulesCache = new Map<string, Intl.PluralRules>();
  private subscribers: Set<Subscriber<T>> = new Set();
  private loader?: ResourceLoader;
  private loadedNamespaces: Set<string> = new Set();
  private loadedLanguages: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<void>> = new Map();
  private version: number = 0;

  /**
   * Creates a new LocL instance.
   * @param config - The configuration object.
   */
  constructor(config: LocLConfig<T, Fallback> & { fallbackLanguage: Fallback, formatters?: F, useDefaultFormatters?: UseDefaultFormatter, scope?: S }) {
    if (!config.resources) { throw new Error("[LocL] `resources` is required"); }
    if (!config.fallbackLanguage) { throw new Error("[LocL] `fallbackLanguage` is required"); }
    this.config = {
      useDefaultFormatters: true as UseDefaultFormatter,
      devMode: false,
      useCache: true,
      ...config
    };
    this.resources = { ...config.resources } as const;
    this.language = this.isLanguage(config.language) ?? config.fallbackLanguage;
    this.fallbackLanguage = config.fallbackLanguage;
    this.scope = config.scope as S;
    this.loader = config.loader;
    this.formatters = (this.config.useDefaultFormatters
      ? { ...(defaultFormatters as DefaultFormatters), ...(config.formatters ?? {}) }
      : { ...(config.formatters ?? {}) }) as EffectiveFormatters<F, UseDefaultFormatter>;
  }

  /**
   * Creates a new proxy translator instance with a different configuration.
   * This is a lightweight way to create a translator with a different scope or language
   * without creating a completely new instance.
   * @param config - The configuration object.
   * @param {N} [config.scope] - The scope to load translations from.
   * @param {Language<T>} [config.language] - The language to use.
   * @returns A new proxy `LocL` instance.
   */
  public withConfig<N extends ScopeType<T, Fallback>>(config: { scope?: N, language?: Language<T> }): LocL<T, Fallback, N> {
    const root = this.rootInstance;
    const cacheKey = `proxy::${config.language ?? this.language}::${Array.isArray(config.scope) ? config.scope.join("|") : config.scope ?? "*"}`;
    if (root.cache.has(cacheKey)) {
      return root.cache.get(cacheKey) as LocL<T, Fallback, N>;
    }

    const result = new Proxy(root, {
      get(target, prop, receiver) {
        if (prop === "language") {
          return config.language ?? target.language;
        }
        if (prop === "scope") {
          return config.scope !== undefined ? config.scope : target.scope;
        }
        if (prop === "rootInstance") {
          return target;
        }
        if (prop === "subscribe" && config.language !== undefined) {
          return (listener: Subscriber<T>) => {
            try {
              listener(config.language!, config.language!);
            }
            catch (err) {
              console.error("[LocL] Error in subscriber:", err);
            }
            return () => {};
          };
        }
        return Reflect.get(target, prop, receiver);
      }
    }) as unknown as LocL<T, Fallback, N>;

    if (root.config.useCache) {
      root.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Creates a new `LocL` instance with a different language or scope.
   * @param language - The language to use for the new instance. Defaults to the current language.
   * @param scope - The scope to use for the new instance.
   * @returns A new `LocL` instance.
   */
  public clone<N extends ScopeType<T, Fallback> = undefined>(language: Language<T> = this.language, scope?: N): LocL<T, Fallback, N> {
    return new LocL({
      ...this.config,
      resources: this.resources as T,
      language: language as any,
      scope: scope as any,
    }) as any;
  }

  /**
   * Subscribes a listener to language changes.
   * Conforms to the standard reactive store contract (e.g. Svelte stores).
   * Calls the listener immediately with the current language and returns an unsubscribe function.
   * @param listener - The subscriber callback function.
   * @returns An unsubscribe function.
   */
  public subscribe(listener: Subscriber<T>): Unsubscribe {
    this.subscribers.add(listener);
    try {
      listener(this.language, this.language);
    }
    catch (err) {
      console.error("[LocL] Error in initial subscriber call:", err);
    }
    return () => {
      this.subscribers.delete(listener);
    };
  }

  /**
   * Gets the current active language.
   */
  public getLanguage(): Language<T> {
    return this.language;
  }
  public getVersion(): number {
    return this.version;
  }

  /**
   * Checks if an entire language or specific namespace is loaded.
   */
  public isLoaded(lang: string = this.language, namespace?: string): boolean {
    if (namespace) {
      const key = `${lang}::${namespace}`;
      if (this.loadedNamespaces.has(key)) return true;
      const langObj = this.resources[lang];
      if (langObj && typeof langObj === "object") {
        return namespace.split(".").reduce((acc, k) => acc?.[k], langObj) !== undefined;
      }
      return false;
    }
    return this.loadedLanguages.has(lang) || Object.keys(this.resources[lang] ?? {}).length > 0;
  }
  /**
   * Resolves raw data from JSON, TS/JS modules, functions, or fetch Responses into a clean dictionary object.
   */
  private async resolveBundle(raw: any, namespace?: string): Promise<Record<string, any>> {
    let data = raw;

    // 1. Direct fetch() Response object: automatically call .json()
    if (typeof Response !== "undefined" && data instanceof Response) {
      data = await data.json();
    }
    // 2. Raw JSON string: parse it
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch { }
    }
    // 3. ES Module default export (dynamic import('./file.ts') or import('./file.json'))
    if (data && typeof data === "object" && "default" in data) {
      data = data.default;
    }
    // 4. Function / Factory export: export default () => ({ ... })
    if (typeof data === "function") {
      data = await data();
    }
    // 5. Named export from a TS module: e.g. `export const user = { ... }` or `export const translations = { ... }`
    if (data && typeof data === "object" && namespace && !(namespace in data)) {
      if (typeof data.translations === "object") {
        data = data.translations;
      } else if (typeof data.messages === "object") {
        data = data.messages;
      } else if (typeof data.resources === "object") {
        data = data.resources;
      }
    } else if (data && typeof data === "object" && namespace && typeof data[namespace] === "object") {
      data = data[namespace];
    }

    return (data && typeof data === "object" && !Array.isArray(data)) ? data : {};
  }
  /**
   * Loads a full language file (e.g. `de.json`) or a namespace (e.g. `de/dashboard.json`).
   * Supports both monolithic files and modular namespaces.
   */
  public async load(lang: string = this.language, namespace?: string, loader: ResourceLoader | undefined = this.loader): Promise<void> {
    if (this.isLoaded(lang, namespace)) { return; }

    const key = namespace ? `${lang}::${namespace}` : `${lang}::*`;
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    if (!loader) {
      throw new Error(`[LocL] No loader configured to load translations for "${lang}"${namespace ? ` ("${namespace}")` : ""}.`);
    }

    const loadPromise = (async () => {
      try {
        const raw = await loader(lang, namespace);
        const bundle = await this.resolveBundle(raw, namespace);

        if (namespace) {
          // Namespaced file: nest under namespace path
          const nested: Record<string, any> = {};
          namespace.split(".").reduce((acc, k, i, arr) => {
            acc[k] = (i === arr.length - 1) ? bundle : {};
            return acc[k];
          }, nested);
          this.addResources(lang, nested);
          this.loadedNamespaces.add(key);
        }
        else {
          // Monolithic language file: merge directly at root of language!
          this.addResources(lang, bundle);
          this.loadedLanguages.add(lang);
        }
      }
      finally {
        this.loadingPromises.delete(key);
      }
    })();

    this.loadingPromises.set(key, loadPromise);
    return loadPromise;
  }
  public loadLanguage(lang: string, loader?: ResourceLoader): Promise<void> {
    return this.load(lang, undefined, loader);
  }
  public loadNamespace(namespace: string, lang: string = this.language, loader?: ResourceLoader): Promise<void> {
    return this.load(lang, namespace, loader);
  }

  /**
   * Adds or overrides a single translation key at runtime.
   * @param lang - Target language code.
   * @param key - Dotted path key.
   * @param value - The translation value.
   */
  public addResource(lang: Language<T> | string, key: string, value: any) {
    if (this.isUnsafeObjectKey(lang)) { return; }

    const keys = key.split(".");
    if (keys.some((k) => this.isUnsafeObjectKey(k))) {
      return;
    }
    if (!this.resources[lang]) {
      this.resources[lang] = Object.create(null);
    }
    
    let current = this.resources[lang];
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== "object") {
        current[k] = Object.create(null);
      }
      current = current[k];
    }
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
    this.invalidateCacheForLang(lang);
    this.version++;
    this.notifySubscribers();
  }

  /**
   * Deeply merges a resource bundle into the specified language at runtime.
   * @param lang - Target language code.
   * @param bundle - Object of translations to merge.
   * @returns DeepMergedResource LocL type
   */
  public addResources<const L extends Language<T> | string, const B extends Record<string, any>>(lang: L, bundle: B): LocL<DeepMergeResources<T, L, B>, Fallback, S, F, UseDefaultFormatter> {
    if (this.isUnsafeObjectKey(lang)) { return this as any; }
    if (!this.resources[lang]) {
      this.resources[lang] = Object.create(null);
    }
    const deepMerge = (target: any, source: any) => {
      for (const k of Object.keys(source)) {
        if (this.isUnsafeObjectKey(k)) { continue; }
        if (source[k] && typeof source[k] === "object" && !Array.isArray(source[k])) {
          if (!target[k] || typeof target[k] !== "object") {
            target[k] = Object.create(null);
          }
          deepMerge(target[k], source[k]);
        }
        else {
          target[k] = source[k];
        }
      }
    };
    deepMerge(this.resources[lang], bundle);
    this.invalidateCacheForLang(lang);
    this.version++;
    this.notifySubscribers();
    return this as any;
  }

  /**
   * Changes the current language of the translator.
   * @param lang - The new language to set.
   */
  public changeLanguage(lang: Language<T>) {
    const validated = this.isLanguage(lang);
    if (validated && validated !== this.language) {
      const prev = this.language;
      this.language = validated;
      this.version++;
      for (const sub of this.subscribers) {
        try {
          sub(this.language, prev);
        }
        catch (err) {
          console.error("[LocL] Error in subscriber:", err);
        }
      }
    }
  }

  /**
   * Translates a key.
   * If no key is provided, it returns the entire translation object for the current scope.
   * @param key - The key to translate.
   * @param values - An object with values to interpolate into the translation.
   * @param format - An object with formatting options.
   * @returns The translated and formatted string, or the translation object.
   */
  public t<K extends (NestedKeyOf<TranslationObjectFor<S, T, Fallback>> | PluralKeys<S, T, Fallback>) & string>(
  key: K,
  ...args: TArgs<K, TranslationObjectFor<S, T, Fallback>, PluralKeys<S, T, Fallback>, F, UseDefaultFormatter>
): TResult<K, TranslationObjectFor<S, T, Fallback>, PluralKeys<S, T, Fallback>>;
  public t(key?: string, values?: any, format?: FormatOptions<F, UseDefaultFormatter>): any {
    if (!key) { return this.get(); }
    const pluralCheckResult = this.checkPlural(key, values);
    if (pluralCheckResult !== undefined) {
      if (format && format.formatter) {
        return this.applyFormat(pluralCheckResult, format.formatter, format.args);
      }
      return pluralCheckResult;
    }

    const result = this.lookupWithFallback(key);
    const interpolated = this.interpolate(result, values) ?? key;

    if (format && format.formatter) {
      return this.applyFormat(interpolated, format.formatter, format.args);
    }
    return interpolated;
  }
  
  /**
   * Translates a key without strict type checking.
   * This is useful for compatibility with other i18n libraries or dynamic keys.
   * @param key - The key to translate.
   * @param values - An object with values to interpolate into the translation.
   * @param format - An object with formatting options.
   * @returns The translated and formatted string.
   */
  public tt(key?: any, values?: InterpolationOptions, format?: FormatOptions<F, UseDefaultFormatter>): any {
    return this.t(key as any, values as any, format as any);
  }

  /**
   * Formats a value using a specific formatter.
   * @param value - The value to format.
   * @param formatter - The name of the formatter to use.
   * @param args - An array of arguments to pass to the formatter.
   * @returns The formatted string.
   */
  public format(value: string, formatter: keyof EffectiveFormatters<F, UseDefaultFormatter>, args?: string[]): string {
    return this.applyFormat(value, formatter, args);
  }

  /**
   * Translates a key with pluralization.
   * It automatically selects the correct plural form based on the `count` value.
   * @param key - The base key for the pluralization.
   * @param values - An object with a `count` property and other values to interpolate.
   * @param format - An object with formatting options.
   * @returns The translated, pluralized, and formatted string.
   */
  public plural<K extends PluralKeys<S, T, Fallback>>(key: K, values: PluralParamsFor<K, TranslationObjectFor<S, T, Fallback>>, format?: FormatOptions<F, UseDefaultFormatter>): string;
  public plural(key: any, values: any, format?: any): string {
    return this.t(key as any, values as any, format as any) as string;
  }

  /**
   * Translates a key and interpolates rich elements using tag functions.
   * Matches `<tag>content</tag>` in translation templates.
   * @param key - The key to translate.
   * @param tags - An object mapping tag names to functions that transform their inner content.
   * @param values - Values to interpolate into variable placeholders ({name}, {{name}}).
   * @returns An array of chunks (strings and custom rendered tag values).
   * @example
   * ```ts
   * translator.rich("terms", {
   *   link: (content) => `<a href="/terms">${content}</a>`
   * }, { name: "Alice" });
   * ```
   */
  public rich<TOutput = any>(key: string, tags: TagInterpolationOptions<TOutput>, values?: InterpolationOptions): (string | TOutput)[] {
    const rawStr = this.t(key as any, values as any);
    if (typeof rawStr !== "string") {
      return [rawStr as any];
    }

    const tagRegex = /<([a-zA-Z0-9_-]+)>([\s\S]*?)<\/\1>/g;
    const result: (string | TOutput)[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(rawStr)) !== null) {
      if (match.index > lastIndex) {
        result.push(rawStr.slice(lastIndex, match.index));
      }
      const tagName = match[1];
      const content = match[2];
      const renderer = tags[tagName];
      
      typeof renderer === "function"
        ? result.push(renderer(content))
        : result.push(match[0]);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < rawStr.length) {
      result.push(rawStr.slice(lastIndex));
    }

    return result;
  }

  /**
   * Gets a translation object or a specific translation value.
   * If no key is provided, it returns the entire translation object for the current language and scope.
   * @param key - The key of the translation to get.
   * @returns The translation object or value, or `undefined` if not found.
   */
  public get(): TranslationObjectFor<S, T, Fallback>;
  public get<K extends NestedKeyOf<TranslationObjectFor<S, T, Fallback>>>(key: K): PathValue<TranslationObjectFor<S, T, Fallback>, K> | undefined;
  public get(key?: string): any {
    const base = this.buildTranslationObject(this.language);
    if (!key) {
      return base ? this.makeReadOnly(base) : undefined;
    }
    const val = this.lookupWithFallback(key, base);
    return (val && typeof val === "object") ? this.makeReadOnly(val) : val;
  }

  /**
   * Gets a nested object from the translations.
   * This is a type-safe way to get a nested object.
   * @param key - The key of the object to get.
   * @returns The nested translation object, or `undefined` if not found.
   */
  public getObj<K extends NestedKeyOfObj<TranslationObjectFor<S, T, Fallback>, false>>(key: K): PathValue<TranslationObjectFor<S, T, Fallback>, K> | undefined {
    return this.get(key as never) as any
  }


  private isLanguage(value?: string) {
    if (!value) { return null; }
    const available = Object.keys(this.resources);
    if (available.includes(value)) {
      return value as Language<T>;
    }
    const prefix = value.substring(0, 2);
    if (available.includes(prefix)) {
      return prefix as Language<T>;
    }
    return null;
  }

  private getCacheKey(language: Language<T>) {
    const scopeKey = Array.isArray(this.scope) ? this.scope.join("|") : this.scope;
    return `${language}::${scopeKey}`;
  }

  private invalidateCacheForLang(lang: Language<T>) {
    const prefix = `${lang}::`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  private lookupWithFallback(key: string, base?: object) {
    const keys = key.split(".");
    let result = this.findTranslation(keys, base ?? this.buildTranslationObject(this.language));

    if (result === undefined && this.config.devMode) {
      console.warn(`[LocL] Missing key: "${key}" in "${this.language}"`);
    }
    if (result === undefined) {
      const fbBase = this.buildTranslationObject(this.fallbackLanguage);
      result = this.findTranslation(keys, fbBase);
    }
    if (result === undefined && this.config.devMode) {
      console.warn(`[LocL] Missing key: "${key}" in "${this.fallbackLanguage}"`);
    }
    return result;
  }

  private buildTranslationObject(language: Language<T>): object | undefined {
    const langObject = this.resources[language];
    if (!this.scope) { return langObject; }

    const cacheKey = this.getCacheKey(language);
    if (this.config.useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (typeof this.scope === "string") {
      const result = this.scope.split(".")
        .reduce<Record<string, any> | undefined>((acc, k) => acc?.[k], langObject);
      if (this.config.useCache) { this.cache.set(cacheKey, result); }
      result === undefined && this.config.devMode && console.warn(`[LocL] Missing namespace: "${this.scope}" in "${this.language}"`);
      return result;
    }

    if (Array.isArray(this.scope)) {
      const combined: any = {};
      for (const mod of this.scope) {
        const val = mod.split(".").reduce((acc, k) => acc?.[k], langObject);
        if (val) {
          mod.split(".").reduce((acc, k, i, arr) => {
            if (i === arr.length - 1) { acc[k] = val; }
            else { acc[k] ??= {}; }
            return acc[k];
          }, combined);
        }
      }
      if (this.config.useCache) { this.cache.set(cacheKey, combined); }
      return combined;
    }
    if (this.config.useCache) { this.cache.set(cacheKey, undefined); }
    this.config.devMode && console.warn(`[LocL] Missing namespace: "${this.scope}" in "${this.language}"`);

    return undefined;
  }

  private findTranslation(keys: string[], translationObject: any): any {
    if (!translationObject || typeof translationObject !== "object") { return undefined; }
    let current = translationObject;
    const keysCopy = [...keys];
    for (const key of keys) {
      if (current === null || typeof current !== "object") { return undefined; }
      const keyTest = keysCopy.join(".");
      if (Object.prototype.hasOwnProperty.call(current, keyTest)) { return current[keyTest]; }
      if (!(key in current)) { return undefined; }
      current = current[key];
      keysCopy.shift();
    }
    return current;
  }

  private getPluralRules(lang: string): Intl.PluralRules {
    let rules = this.pluralRulesCache.get(lang);
    if (!rules) {
      rules = new Intl.PluralRules(lang);
      this.pluralRulesCache.set(lang, rules);
    }
    return rules;
  }

  private checkPlural(key: string, values?: InterpolationOptions): string | undefined {
    if (values?.count !== undefined && !key.match(/_(zero|one|two|few|many|other)$/)) {
      const category = this.getPluralRules(this.language).select(values.count);

      // 1. Object plural: key: { zero: "...", one: "...", other: "..." }
      const baseValue = this.lookupWithFallback(key, undefined);
      if (baseValue && typeof baseValue === "object") {
        if (values.count === 0 && "zero" in baseValue) {
          return this.interpolate(baseValue.zero, values);
        }
        if (category in baseValue) {
          return this.interpolate(baseValue[category], values);
        } else if ("other" in baseValue) {
          this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
          return this.interpolate(baseValue.other, values);
        } else {
          this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
          return key;
        }
      }

      // 2. Suffix plural: key_zero, key_category, key_other
      if (values.count === 0) {
        const zeroResult = this.lookupWithFallback(`${key}_zero`, undefined);
        if (zeroResult !== undefined) {
          return this.interpolate(zeroResult, values);
        }
      }
      const categoryResult = this.lookupWithFallback(`${key}_${category}`, undefined);
      if (categoryResult !== undefined) {
        return this.interpolate(categoryResult, values);
      }
      const otherResult = this.lookupWithFallback(`${key}_other`, undefined);
      if (otherResult !== undefined) {
        this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
        return this.interpolate(otherResult, values);
      }
      const anySuffixExists = ["zero", "one", "two", "few", "many"]
        .some(cat => this.lookupWithFallback(`${key}_${cat}`, undefined) !== undefined);
      if (anySuffixExists) {
        this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
        return key;
      }
    }
    return undefined;
  }

  private interpolate(result: any, values?: InterpolationOptions): string {
    if (!values || typeof result !== "string") { return result; }

    // Searching for all balanced { ... } blocks
    const tokens: { raw: string; inner: string }[] = [];
    let depth = 0, start = -1;
    for (let i = 0; i < result.length; i++) {
      if (result[i] === "{") {
        if (depth === 0) { start = i; }
        depth++;
      }
      else if (result[i] === "}") {
        depth--;
        if (depth === 0 && start >= 0) {
          const raw = result.slice(start, i + 1);
          let inner = raw.slice(1, -1);
          // Support {{var}} double curly brackets seamlessly
          if (inner.startsWith("{") && inner.endsWith("}")) {
            inner = inner.slice(1, -1);
          }
          tokens.push({ raw, inner });
          start = -1;
        }
      }
    }

    let output = result;
    const processed = new Set<string>();

    for (const token of tokens) {
      if (processed.has(token.raw)) { continue; }
      processed.add(token.raw);

      let replacement = "";

      // 1. ICU select handling: {gender, select, male {He} female {She} other {They}}
      const selectMatch = token.inner.match(/^\s*([^,]+),\s*select\s*,\s*([\s\S]+)$/);
      if (selectMatch) {
        const field = selectMatch[1].trim();
        const casesBody = selectMatch[2];
        const value = String(values[field] ?? "other");

        const caseMap: Record<string, string> = {};
        let i = 0;
        while (i < casesBody.length) {
          while (i < casesBody.length && /\s/.test(casesBody[i])) i++;
          if (i >= casesBody.length) break;
          let keyStart = i;
          while (i < casesBody.length && casesBody[i] !== "{" && !/\s/.test(casesBody[i])) i++;
          const caseKey = casesBody.slice(keyStart, i).trim();
          while (i < casesBody.length && casesBody[i] !== "{") i++;
          if (casesBody[i] === "{") {
            let bodyDepth = 1;
            let bodyStart = i + 1;
            i++;
            while (i < casesBody.length && bodyDepth > 0) {
              if (casesBody[i] === "{") bodyDepth++;
              else if (casesBody[i] === "}") bodyDepth--;
              i++;
            }
            const caseText = casesBody.slice(bodyStart, i - 1).trim();
            if (caseKey) {
              caseMap[caseKey] = caseText;
            }
          }
        }

        const rawReplacement = caseMap[value] ?? caseMap.other ?? "";
        replacement = rawReplacement.includes("{") ? this.interpolate(rawReplacement, values) : rawReplacement;
      }
      else {
        // 2. Interpolation and Formatter handling: {count | number} or {date | date:YYYY-MM-DD}
        const [fieldName, formatterAndArgs] = token.inner.split("|").map(x => x.trim());
        const [formatterName, argsStr] = formatterAndArgs ? formatterAndArgs.split(":") : [];
        const args = argsStr ? argsStr.split(",").map(a => a.trim()) : [];
        const val = values[fieldName];

        if (formatterName) {
          if (this.formatters?.[formatterName]) {
            replacement = this.formatters[formatterName](val, args);
          } else {
            this.config.devMode && console.warn(`[LocL] Formatter "${formatterName}" not found.`);
            replacement = val !== undefined ? String(val) : token.raw;
          }
        }
        else if (val instanceof Date) {
          replacement = new Intl.DateTimeFormat(this.language).format(val);
        }
        else if (typeof val === "number") {
          replacement = new Intl.NumberFormat(this.language).format(val);
        }
        else {
          replacement = val !== undefined ? String(val) : token.raw;
        }
      }
      output = output.split(token.raw).join(replacement);
    }
    return output;
  }

  private applyFormat(value: string, formatter: keyof EffectiveFormatters<F, UseDefaultFormatter>, args?: any): string {
    const formatterFn = this.formatters?.[formatter];
    if (!formatterFn) {
      this.config.devMode && console.warn(`[LocL] Formatter "${formatter.toString()}" not found.`);
      return value;
    }
    return formatterFn(value, args);
  }

  private makeReadOnly<T extends object>(obj: T): T {
    const self = this;
    if (this.proxyCache.has(obj)) {
      return this.proxyCache.get(obj);
    }
    const proxy = new Proxy(obj, {
      get(target, prop, receiver) {
        const val = Reflect.get(target, prop, receiver);
        return (val && typeof val === "object") ? self.makeReadOnly(val) : val;
      },
      set: () => false,
      deleteProperty: () => false,
      defineProperty: () => false,
      setPrototypeOf: () => false
    });
    this.proxyCache.set(obj, proxy);
    return proxy;
  }

  private notifySubscribers() {
    for (const sub of this.subscribers) {
      try {
        sub(this.language, this.language);
      } catch (err) {
        console.error("[LocL] Error in subscriber:", err);
      }
    }
  }

  private isUnsafeObjectKey(key: string): boolean {
    return key === "__proto__" || key === "constructor" || key === "prototype";
  }
}
