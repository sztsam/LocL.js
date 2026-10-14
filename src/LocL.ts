import {
  ScopeType, Formatter, Language, EffectiveFormatters, FormatOptions, InterpolationOptions,
  NestedKeyOf, NestedKeyOfObj, PathValue, TranslationObjectFor, PluralKeys, DeepMergeResources, 
  TagInterpolationOptions, PluralParamsFor, TArgs, TResult, Subscriber, Unsubscribe, ResourceLoader,
  PseudoLocalizationOptions, Direction, LocaleMetadata, TemplateChunk, FormatterCall
} from "./types.js";
import { type DefaultFormatters, defaultFormatters } from "./formatters.js";

const PSEUDO_ACCENT_MAP: Record<string, string> = {
  a: "á", b: "ḅ", c: "ç", d: "đ", e: "é", f: "ƒ", g: "ğ", h: "ḩ", i: "í",
  j: "ĵ", k: "ķ", l: "ļ", m: "ɱ", n: "ñ", o: "ö", p: "þ", q: "ǫ", r: "ŕ",
  s: "š", t: "ţ", u: "ú", v: "ṽ", w: "ŵ", x: "ẋ", y: "ý", z: "ž",
  A: "Á", B: "Ḅ", C: "Ç", D: "Ð", E: "É", F: "Ƒ", G: "Ğ", H: "Ḩ", I: "Í",
  J: "Ĵ", K: "Ķ", L: "Ļ", M: "Ṃ", N: "Ñ", O: "Ö", P: "Þ", Q: "Ǫ", R: "Ŕ",
  S: "Š", T: "Ţ", U: "Ú", V: "Ṽ", W: "Ŵ", X: "Ẋ", Y: "Ý", Z: "Ž"
};
const RTL_SCRIPT_SUBTAGS = new Set([
  "arab", "hebr", "syrc", "samr", "mand", "thaa", "mend", "nkoo", "adlm", "rohg", "yezi"
]);
const RTL_PRIMARY_LANGUAGES = new Set([
  "ar", "arc", "bcc", "bqi", "ckb", "dv", "fa", "glk", "he", "iw", "khw", "ks", "ku", "mzn", "pnb", "ps", "sd", "ug", "ur", "yi", "ji"
]);


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
  /** Enables caching of scopes, proxies, and compiled templates. Defaults to `true`. */
  useCache?: boolean;
  /** Default async loader function for lazy loading namespaces */
  loader?: ResourceLoader;
  /** Built-in Pseudo-Localization for enterprise layout & QA testing */
  pseudoLocalization?: boolean | PseudoLocalizationOptions;
  /** Automatically syncs document.documentElement dir and lang attributes in browser environments. Defaults to `true`. */
  autoSyncDocument?: boolean;
  /** When false, disables recursive template-literal parsing for large dictionaries to maximize tsc performance */
  strictParams?: boolean;
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
  UseDefaultFormatter extends boolean = true,
  StrictParams extends boolean = true
> {
  private readonly rootInstance: LocL<T, Fallback, any, F, UseDefaultFormatter, StrictParams> = this;
  private config: LocLConfig<T, Fallback, F>;
  private resources: T & Record<string, any>;
  private language: Language<T>;
  private fallbackLanguage: Language<T>;
  private scope?: S;
  private formatters: EffectiveFormatters<F, UseDefaultFormatter>;
  private cache: Map<string, object | LocL<T, Fallback, any, any, any, any> | undefined> = new Map();
  private templateCache: Map<string, TemplateChunk[]> = new Map();
  private proxyCache = new WeakMap<object, any>();
  private pluralRulesCache = new Map<string, Intl.PluralRules>();
  private dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();
  private numberFormatCache = new Map<string, Intl.NumberFormat>();
  private subscribers: Set<Subscriber<T>> = new Set();
  private loader?: ResourceLoader;
  private loadedNamespaces: Set<string> = new Set();
  private loadedLanguages: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<void>> = new Map();
  private version: number = 0;
  private pseudoOptions?: PseudoLocalizationOptions;

  /**
   * Creates a new LocL instance.
   * @param config - The configuration object.
   */
  constructor(config: LocLConfig<T, Fallback, F> & { fallbackLanguage: Fallback; formatters?: F; useDefaultFormatters?: UseDefaultFormatter; scope?: S; strictParams?: StrictParams }) {
    if (!config.resources) { throw new Error("[LocL] `resources` is required"); }
    if (!config.fallbackLanguage) { throw new Error("[LocL] `fallbackLanguage` is required"); }
    this.config = {
      useDefaultFormatters: true as UseDefaultFormatter,
      devMode: false,
      useCache: true,
      autoSyncDocument: true,
      ...config
    };
    this.resources = { ...config.resources } as const;
    this.language = this.validateSupportedLanguage(config.language) ?? config.fallbackLanguage;
    this.fallbackLanguage = config.fallbackLanguage;
    this.scope = config.scope as S;
    this.loader = config.loader;
    config.pseudoLocalization && this.setPseudoLocalization(config.pseudoLocalization);
    this.formatters = (this.config.useDefaultFormatters
      ? { ...(defaultFormatters as DefaultFormatters), ...(config.formatters ?? {}) }
      : { ...(config.formatters ?? {}) }) as EffectiveFormatters<F, UseDefaultFormatter>;
    
    this.syncBrowserDocumentAttributes();
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
  public withConfig<N extends ScopeType<T, Fallback>>(config: { scope?: N, language?: Language<T> }): LocL<T, Fallback, N, F, UseDefaultFormatter, StrictParams> {
    const root = this.rootInstance;
    const cacheKey = `proxy::${config.language ?? this.language}::${Array.isArray(config.scope) ? config.scope.join("|") : config.scope ?? "*"}`;
    if (root.cache.has(cacheKey)) {
      return root.cache.get(cacheKey) as LocL<T, Fallback, N, F, UseDefaultFormatter, StrictParams>;
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
        if (prop === "getLanguage") {
          return () => config.language ?? target.language;
        }
        if (prop === "getDirection") {
          return (lang?: string) => target.getDirection(lang ?? config.language ?? target.language);
        }
        if (prop === "isRTL") {
          return (lang?: string) => target.isRTL(lang ?? config.language ?? target.language);
        }
        if (prop === "getMetadata") {
          return (lang?: string) => target.getMetadata(lang ?? config.language ?? target.language);
        }
        if (prop === "subscribe" && config.language !== undefined) {
          return (listener: Subscriber<T>) => {
            try {
              listener(config.language!, config.language!, target.getMetadata(config.language!));
            }
            catch (err) {
              console.error("[LocL] Error in subscriber:", err);
            }
            return () => {};
          };
        }
        return Reflect.get(target, prop, receiver);
      }
    }) as unknown as LocL<T, Fallback, N, F, UseDefaultFormatter, StrictParams>;

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
  public clone<N extends ScopeType<T, Fallback> = undefined>(language: Language<T> = this.language, scope?: N): LocL<T, Fallback, N, F, UseDefaultFormatter, StrictParams> {
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
      listener(this.language, this.language, this.getMetadata());
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
  public getDirection(lang: string = this.language): Direction {
    if (!lang) { return "ltr"; }
    try {
      const locale = new Intl.Locale(lang);
      const info = typeof (locale as any).getTextInfo === "function"
        ? (locale as any).getTextInfo()
        : (locale as any).textInfo;
      if (info && (info.direction === "rtl" || info.direction === "ltr")) {
        return info.direction;
      }
    } catch { }

    const normalized = lang.toLowerCase().replace(/_/g, "-");
    const parts = normalized.split("-");
    const primary = parts[0];

    const script = parts.find((p) => p.length === 4);
    if (script) {
      return RTL_SCRIPT_SUBTAGS.has(script) ? "rtl" : "ltr";
    }
    return RTL_PRIMARY_LANGUAGES.has(primary) ? "rtl" : "ltr";
  }
  public isRTL(lang: string = this.language): boolean {
    return this.getDirection(lang) === "rtl";
  }
  public getMetadata(lang: string = this.language): LocaleMetadata {
    const dir = this.getDirection(lang);
    return {
      language: lang,
      direction: dir,
      isRTL: dir === "rtl"
    };
  }

  /**
   * Generates a BCP 47 hierarchical fallback chain:
   * e.g. "de-AT-Vienna" -> ["de-AT-Vienna", "de-AT", "de", "en"]
   */
  public getFallbackChain(lang: string = this.language): string[] {
    const chain: string[] = [];
    let current = lang;

    while (current) {
      chain.push(current);
      const lastSeparator = Math.max(current.lastIndexOf("-"), current.lastIndexOf("_"));
      if (lastSeparator === -1) { break; }
      current = current.slice(0, lastSeparator);
    }

    if (!chain.includes(this.fallbackLanguage)) {
      chain.push(this.fallbackLanguage);
    }
    return chain;
  }

  /**
   * Checks if an entire language or specific namespace is loaded.
   */
  public isLoaded(lang: string = this.language, namespace?: string): boolean {
    if (namespace) {
      const key = `${lang}::${namespace}`;
      if (this.loadedNamespaces.has(key)) { return true; }
      const langObj = this.resources[lang];
      if (langObj && typeof langObj === "object") {
        return namespace.split(".").reduce((acc, k) => acc?.[k], langObj) !== undefined;
      }
      return false;
    }
    return this.loadedLanguages.has(lang) || Object.keys(this.resources[lang] ?? {}).length > 0;
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
      const raw = await loader(lang, namespace);
      const bundle = await this.resolveRawBundle(raw, namespace);

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
    })();

    this.loadingPromises.set(key, loadPromise);
    const settled = () => {
      if (this.loadingPromises.get(key) === loadPromise) {
        this.loadingPromises.delete(key);
      }
    };
    loadPromise.then(settled, settled);
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
    this.invalidateCacheForLanguage(lang);
    this.version++;
    this.notifySubscribers();
  }

  /**
   * Deeply merges a resource bundle into the specified language at runtime.
   * @param lang - Target language code.
   * @param bundle - Object of translations to merge.
   * @returns DeepMergedResource LocL type
   */
  public addResources<const L extends Language<T> | string, const B extends Record<string, any>>(lang: L, bundle: B): LocL<DeepMergeResources<T, L, B>, Fallback, S, F, UseDefaultFormatter, StrictParams> {
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
    this.invalidateCacheForLanguage(lang);
    this.version++;
    this.notifySubscribers();
    return this as any;
  }

  /**
   * Changes the current language of the translator.
   * @param lang - The new language to set.
   */
  public changeLanguage(lang: Language<T>) {
    const validated = this.validateSupportedLanguage(lang);
    if (validated && validated !== this.language) {
      const prev = this.language;
      this.language = validated;
      this.version++;
      this.syncBrowserDocumentAttributes();
      const meta = this.getMetadata(this.language);
      for (const sub of this.subscribers) {
        try {
          sub(this.language, prev, meta);
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
    ...args: TArgs<K, TranslationObjectFor<S, T, Fallback>, PluralKeys<S, T, Fallback>, F, UseDefaultFormatter, StrictParams>
  ): TResult<K, TranslationObjectFor<S, T, Fallback>, PluralKeys<S, T, Fallback>, StrictParams>;
  public t(key?: string, values?: any, format?: FormatOptions<F, UseDefaultFormatter>): any {
    if (!key) { return this.get(); }
    const pluralResult = this.resolvePluralKey(key, values);
    if (pluralResult !== undefined) {
      if (format && format.formatter) {
        return this.applyNamedFormatter(pluralResult, format.formatter, format.args);
      }
      return pluralResult;
    }

    const rawTranslation = this.lookupKeyWithFallback(key);
    const interpolated = this.evaluateTemplate(rawTranslation, values) ?? key;

    if (format && format.formatter) {
      return this.applyNamedFormatter(interpolated, format.formatter, format.args);
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
    return this.applyNamedFormatter(value, formatter, args);
  }

  /**
   * Translates a key with pluralization.
   * It automatically selects the correct plural form based on the `count` value.
   * @param key - The base key for the pluralization.
   * @param values - An object with a `count` property and other values to interpolate.
   * @param format - An object with formatting options.
   * @returns The translated, pluralized, and formatted string.
   */
  public plural<K extends PluralKeys<S, T, Fallback>>(
    key: K,
    values: StrictParams extends false
      ? { count: number } & InterpolationOptions
      : PluralParamsFor<K, TranslationObjectFor<S, T, Fallback>>,
    format?: FormatOptions<F, UseDefaultFormatter>
  ): string;
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

    const tagRegex = /<([a-zA-Z0-9_-]+)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9_-]+)\s*\/>/g;
    const result: (string | TOutput)[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(rawStr)) !== null) {
      if (match.index > lastIndex) {
        result.push(rawStr.slice(lastIndex, match.index));
      }
      const isSelfClosing = match[3] !== undefined;
      const tagName = isSelfClosing ? match[3] : match[1];
      const content = isSelfClosing ? "" : match[2];
      const renderer = tags[tagName];
      
      if (typeof renderer === "function") {
        result.push(renderer(content));
      } else if (renderer !== undefined) {
        result.push(String(renderer));
      } else {
        result.push(match[0]);
      }
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
    const base = this.buildScopedTranslationObject(this.language);
    if (!key) {
      return base ? this.makeReadOnly(base) : undefined;
    }
    const val = this.lookupKeyWithFallback(key, base);
    return (val && typeof val === "object") ? this.makeReadOnly(val) : val;
  }

  /**
   * Gets a nested object from the translations.
   * This is a type-safe way to get a nested object.
   * @param key - The key of the object to get.
   * @returns The nested translation object, or `undefined` if not found.
   */
  public getObj<K extends NestedKeyOfObj<TranslationObjectFor<S, T, Fallback>, false>>(key: K): PathValue<TranslationObjectFor<S, T, Fallback>, K> | undefined {
    return this.get(key as never) as any;
  }

  /**
   * Configures or toggles pseudo-localization at runtime.
   */
  public setPseudoLocalization(options: boolean | PseudoLocalizationOptions): void {
    if (typeof options === "boolean") {
      this.pseudoOptions = options ? { enabled: true } : undefined;
    } else {
      this.pseudoOptions = options.enabled !== false ? { enabled: true, ...options } : undefined;
    }
    this.cache.clear();
    this.templateCache.clear();
    this.version++;
    this.notifySubscribers();
  }


  /* =========================================================================
   * Fast Template Compilation & Evaluation Engine & Plural Resolution
   * ========================================================================= */

  private evaluateTemplate(template: any, values?: InterpolationOptions): string {
    if (typeof template !== "string") { return template; }

    const cacheKey = this.pseudoOptions?.enabled ? `pseudo::${template}` : `raw::${template}`;
    let chunks = this.templateCache.get(cacheKey);

    if (!chunks) {
      chunks = this.compileTemplateIntoChunks(template);
      if (this.config.useCache) {
        this.templateCache.set(cacheKey, chunks);
      }
    }

    if (chunks.length === 1 && chunks[0].type === "lit") {
      return chunks[0].value;
    }

    let output = "";
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.type === "lit") {
        output += chunk.value;
      } else if (chunk.type === "var") {
        output += this.evaluateVariableChunk(chunk, values);
      } else if (chunk.type === "select") {
        output += this.evaluateSelectChunk(chunk, values);
      }
    }

    return output;
  }

  private compileTemplateIntoChunks(template: string): TemplateChunk[] {
    let text = template;
    if (this.pseudoOptions?.enabled) {
      text = this.applyPseudoLocalization(text);
    }

    const chunks: TemplateChunk[] = [];
    let lastIndex = 0;
    let depth = 0;
    let start = -1;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === "{") {
        if (depth === 0) {
          if (i > lastIndex) {
            chunks.push({ type: "lit", value: text.slice(lastIndex, i) });
          }
          start = i;
        }
        depth++;
      }
      else if (text[i] === "}") {
        if (depth > 0) {
          depth--;
          if (depth === 0 && start >= 0) {
            const raw = text.slice(start, i + 1);
            let inner = raw.slice(1, -1);
            if (inner.startsWith("{") && inner.endsWith("}")) {
              inner = inner.slice(1, -1);
            }

            const selectMatch = inner.match(/^\s*([^,]+),\s*select\s*,\s*([\s\S]+)$/);
            if (selectMatch) {
              const field = selectMatch[1].trim();
              const cases = this.parseSelectCases(selectMatch[2]);
              chunks.push({ type: "select", field, cases });
            } else {
              const [name, ...pipeParts] = inner.split("|").map((s) => s.trim());
              const formatters: FormatterCall[] = pipeParts.map((segment) => {
                const colonIdx = segment.indexOf(":");
                return colonIdx === -1
                  ? { name: segment.trim(), args: [] }
                  : { name: segment.slice(0, colonIdx).trim(), args: segment.slice(colonIdx + 1).split(",").map((a) => a.trim()) };
              });
              chunks.push({ type: "var", name, raw, formatters });
            }

            lastIndex = i + 1;
            start = -1;
          }
        }
      }
    }

    if (lastIndex < text.length) {
      chunks.push({ type: "lit", value: text.slice(lastIndex) });
    }

    return chunks;
  }

  private evaluateVariableChunk(chunk: TemplateChunk & { type: "var" }, values?: InterpolationOptions): string {
    if (!values) { return chunk.raw; }
    let val = values[chunk.name];
    if (val === undefined) { return chunk.raw; }

    if (chunk.formatters.length > 0) {
      for (const fmt of chunk.formatters) {
        const fn = this.formatters?.[fmt.name];
        if (fn) {
          val = fn(val, fmt.args);
        } else {
          this.config.devMode && console.warn(`[LocL] Formatter "${fmt.name}" not found.`);
        }
      }
      return val !== undefined ? String(val) : chunk.raw;
    }

    if (val instanceof Date) { return this.getDateTimeFormat(this.language).format(val); }
    if (typeof val === "number") { return this.getNumberFormat(this.language).format(val); }
    return String(val);
  }

  private evaluateSelectChunk(chunk: TemplateChunk & { type: "select" }, values?: InterpolationOptions): string {
    const val = values ? String(values[chunk.field] ?? "other") : "other";
    const caseText = chunk.cases[val] ?? chunk.cases.other ?? "";
    return caseText.includes("{") ? this.evaluateTemplate(caseText, values) : caseText;
  }

  private parseSelectCases(casesBody: string): Record<string, string> {
    const cases: Record<string, string> = {};
    let i = 0;
    while (i < casesBody.length) {
      while (i < casesBody.length && /\s/.test(casesBody[i])) { i++; }
      if (i >= casesBody.length) { break; }
      let keyStart = i;
      while (i < casesBody.length && casesBody[i] !== "{" && !/\s/.test(casesBody[i])) { i++; }
      const caseKey = casesBody.slice(keyStart, i).trim();
      while (i < casesBody.length && casesBody[i] !== "{") { i++; }
      if (casesBody[i] === "{") {
        let depth = 1;
        let bodyStart = i + 1;
        i++;
        while (i < casesBody.length && depth > 0) {
          if (casesBody[i] === "{") { depth++; }
          else if (casesBody[i] === "}") { depth--; }
          i++;
        }
        const caseText = casesBody.slice(bodyStart, i - 1).trim();
        if (caseKey) { cases[caseKey] = caseText; }
      }
    }
    return cases;
  }

  private resolvePluralKey(key: string, values?: InterpolationOptions): string | undefined {
    if (values?.count !== undefined && !key.match(/_(zero|one|two|few|many|other)$/)) {
      const exactKey = `=${values.count}`;
      const baseValue = this.lookupKeyWithFallback(key);

      // Plural Objects: { "=0": "...", one: "...", other: "..." }
      if (baseValue && typeof baseValue === "object") {
        if (exactKey in baseValue) {
          return this.evaluateTemplate(baseValue[exactKey], values);
        }
        if (values.count === 0 && "zero" in baseValue) {
          return this.evaluateTemplate(baseValue.zero, values);
        }
        const category = this.getPluralRules(this.language).select(values.count);
        if (category in baseValue) {
          return this.evaluateTemplate(baseValue[category], values);
        }
        if ("other" in baseValue) {
          this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
          return this.evaluateTemplate(baseValue.other, values);
        }
        this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
        return key;
      }

      // Plural Suffixes: messages_=0, messages_one, messages_other
      const exactSuffixValue = this.lookupKeyWithFallback(`${key}_${exactKey}`);
      if (exactSuffixValue !== undefined) {
        return this.evaluateTemplate(exactSuffixValue, values);
      }
      if (values.count === 0) {
        const zeroSuffixValue = this.lookupKeyWithFallback(`${key}_zero`);
        if (zeroSuffixValue !== undefined) {
          return this.evaluateTemplate(zeroSuffixValue, values);
        }
      }
      const category = this.getPluralRules(this.language).select(values.count);
      const categorySuffixValue = this.lookupKeyWithFallback(`${key}_${category}`);
      if (categorySuffixValue !== undefined) {
        return this.evaluateTemplate(categorySuffixValue, values);
      }
      const otherSuffixValue = this.lookupKeyWithFallback(`${key}_other`);
      if (otherSuffixValue !== undefined) {
        this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
        return this.evaluateTemplate(otherSuffixValue, values);
      }
      const anySuffixExists = ["zero", "one", "two", "few", "many"]
        .some(cat => this.lookupKeyWithFallback(`${key}_${cat}`) !== undefined);
      if (anySuffixExists) {
        this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
        return key;
      }
    }
    return undefined;
  }


  /* =========================================================================
   * Internal Lookups, Formatters & DOM Helpers
   * ========================================================================= */

  private validateSupportedLanguage(value?: string): Language<T> | null {
    if (!value) { return null; }
    const available = Object.keys(this.resources);
    
    // Check exact match and BCP 47 truncated subtags
    let current = value;
    while (current) {
      if (available.includes(current)) {
        return current as Language<T>;
      }
      const lastSeparator = Math.max(current.lastIndexOf("-"), current.lastIndexOf("_"));
      if (lastSeparator === -1) { break; }
      current = current.slice(0, lastSeparator);
    }

    // 2-letter fallback
    const prefix = value.substring(0, 2);
    if (available.includes(prefix)) {
      return prefix as Language<T>;
    }
    return null;
  }

  private buildLanguageScopeCacheKey(language: Language<T>): string {
    const scopeKey = Array.isArray(this.scope) ? this.scope.join("|") : this.scope;
    return `${language}::${scopeKey}`;
  }

  private invalidateCacheForLanguage(lang: Language<T>) {
    const prefix = `${lang}::`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  private lookupKeyWithFallback(key: string, base?: object) {
    const keys = key.split(".");
    
    if (base) {
      const res = this.findNestedValue(keys, base);
      if (res !== undefined) { return res; }
    }

    const chain = this.getFallbackChain(this.language);
    for (const lang of chain) {
      const langObj = this.buildScopedTranslationObject(lang);
      if (!langObj) { continue; }
      const res = this.findNestedValue(keys, langObj);
      if (res !== undefined) { return res; }
    }

    if (this.config.devMode) {
      console.warn(`[LocL] Missing key: "${key}" in "${this.language}" (fallback chain: ${chain.join(" -> ")})`);
    }
    return undefined;
  }

  private buildScopedTranslationObject(language: Language<T>): object | undefined {
    const langObject = this.resources[language];
    if (!this.scope) { return langObject; }

    const cacheKey = this.buildLanguageScopeCacheKey(language);
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

  private findNestedValue(keys: string[], tree: any): any {
    if (!tree || typeof tree !== "object") { return undefined; }
    let current = tree;
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

  private getDateTimeFormat(lang: string): Intl.DateTimeFormat {
    let fmt = this.dateTimeFormatCache.get(lang);
    if (!fmt) {
      fmt = new Intl.DateTimeFormat(lang);
      this.dateTimeFormatCache.set(lang, fmt);
    }
    return fmt;
  }

  private getNumberFormat(lang: string): Intl.NumberFormat {
    let fmt = this.numberFormatCache.get(lang);
    if (!fmt) {
      fmt = new Intl.NumberFormat(lang);
      this.numberFormatCache.set(lang, fmt);
    }
    return fmt;
  }

  private applyNamedFormatter(value: string, formatter: keyof EffectiveFormatters<F, UseDefaultFormatter>, args?: any): string {
    const formatterFn = this.formatters?.[formatter];
    if (!formatterFn) {
      this.config.devMode && console.warn(`[LocL] Formatter "${formatter.toString()}" not found.`);
      return value;
    }
    return formatterFn(value, args);
  }

  private applyPseudoLocalization(text: string): string {
    const prefix = this.pseudoOptions?.prefix ?? "[!!! ";
    const suffix = this.pseudoOptions?.suffix ?? " !!!]";
    const useAccents = this.pseudoOptions?.accents !== false;

    // Isolate opening tags, closing tags, self-closing tags, and variable tokens
    const tokenRegex = /(<\/?[a-zA-Z0-9_-]+(?:\s[^<>]*|\/)?>|{{[^{}]+}}|{[^{}]+})/g;
    const parts = text.split(tokenRegex);

    const transformed = parts.map((part) => {
      // Don't modify tokens or tags
      if (part.startsWith("<") || part.startsWith("{")) {
        return part;
      }
      if (!useAccents) { return part; }
      return part.split("").map((ch) => PSEUDO_ACCENT_MAP[ch] ?? ch).join("");
    }).join("");

    return `${prefix}${transformed}${suffix}`;
  }

  private syncBrowserDocumentAttributes() {
    if (this.config.autoSyncDocument === false) { return; }
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("dir", this.getDirection());
      document.documentElement.setAttribute("lang", this.language);
    }
  }

  private notifySubscribers() {
    const meta = this.getMetadata();
    for (const sub of this.subscribers) {
      try {
        sub(this.language, this.language, meta);
      } catch (err) {
        console.error("[LocL] Error in subscriber:", err);
      }
    }
  }

  private async resolveRawBundle(raw: any, namespace?: string): Promise<Record<string, any>> {
    // Resolves raw data from JSON, TS/JS modules, functions, or fetch Responses into a clean dictionary object.
    let data = raw;

    // Direct fetch() Response object: automatically call .json()
    if (typeof Response !== "undefined" && data instanceof Response) {
      if (!data.ok) {
        throw new Error(`[LocL] Failed to load resource: ${data.status} ${data.statusText}`);
      }
      data = await data.json();
    }
    // Raw JSON string: parse it
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch { }
    }
    // ES Module default export (dynamic import('./file.ts') or import('./file.json'))
    if (data && typeof data === "object" && "default" in data) {
      data = data.default;
    }
    // Function / Factory export: export default () => ({ ... })
    if (typeof data === "function") {
      data = await data();
    }
    // Named export from a TS module: e.g. `export const user = { ... }` or `export const translations = { ... }`
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

  private isUnsafeObjectKey(key: string): boolean {
    return key === "__proto__" || key === "constructor" || key === "prototype";
  }
}
