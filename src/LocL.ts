import {
  ScopeType, Formatter, Language, EffectiveFormatters, FormatOptions, InterpolationOptions,
  NestedKeyOf, NestedKeyOfObj, PathValue, TranslationObjectFor, PluralKeys, PluralInterpolationOptions
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
  private config: LocLConfig<T, Fallback>;
  private language: Language<T>;
  private fallbackLanguage: Language<T>;
  private scope?: S;
  private pluralRules: Intl.PluralRules;
  private formatters: EffectiveFormatters<F, UseDefaultFormatter>;
  private cache: Map<string, object | LocL<T, Fallback, any> | undefined> = new Map();
  private proxyCache = new WeakMap<object, any>();

  /**
   * Creates a new LocL instance.
   * @param config - The configuration object.
   */
  constructor(config: LocLConfig<T, Fallback> & { fallbackLanguage: Fallback, formatters?: F, useDefaultFormatters?: UseDefaultFormatter, scope?: S }) {
    if (!config.resources) {
      throw new Error("[LocL] `resources` is required");
    }
    if (!config.fallbackLanguage) {
      throw new Error("[LocL] `fallbackLanguage` is required");
    }
    config = {
      useDefaultFormatters: true as UseDefaultFormatter,
      devMode: false,
      useCache: true,
      ...config
    } as any;
    config.resources = this.makeReadOnly(config.resources);
    this.config = config;
    this.language = this.isLanguage(config.language) ?? config.fallbackLanguage;
    this.fallbackLanguage = config.fallbackLanguage;
    this.scope = config.scope as S;
    this.pluralRules = new Intl.PluralRules(this.language);
    this.formatters = (config.useDefaultFormatters
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
    const cacheKey = `proxy::${config.language ?? this.language}::${Array.isArray(config.scope) ? config.scope.join("|") : config.scope ?? "*"}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as LocL<T, Fallback, N>;
    }

    return new Proxy(this, {
      get(target, prop) {
        if (prop === 'language') {
          return config.language ?? target.language;
        }
        if (prop === 'scope') {
          return config.scope;
        }
        return target[prop as keyof typeof target];
      }
    }) as unknown as LocL<T, Fallback, N>;
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
      language: language as any,
      scope: scope as any,
    }) as any;
  }

  /**
   * Changes the current language of the translator.
   * @param lang - The new language to set.
   */
  public changeLanguage(lang: Language<T>) {
    if (Object.keys(this.config.resources).includes(lang)) {
      this.language = lang;
      this.pluralRules = new Intl.PluralRules(this.language);
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
  public t(): TranslationObjectFor<S, T, Fallback>;
  public t<K extends NestedKeyOf<TranslationObjectFor<S, T, Fallback>>>(key: K, values?: InterpolationOptions, format?: FormatOptions<F, UseDefaultFormatter>): PathValue<TranslationObjectFor<S, T, Fallback>, K>;
  public t(key?: string, values?: InterpolationOptions, format?: FormatOptions<F, UseDefaultFormatter>): any {
    if (!key) { return this.get(); }
    const pluralCheckResult = this.checkPlural(key, values);
    if (pluralCheckResult !== undefined) { return pluralCheckResult; }

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
  public plural<K extends PluralKeys<S, T, Fallback>>(key: K, values: PluralInterpolationOptions, format?: FormatOptions<F, UseDefaultFormatter>): string {
    const category = this.pluralRules.select(values.count);
    const baseKey: string = key;
    const baseValue = this.lookupWithFallback(baseKey);
    let interpolated: string;

    // object plural
    if (baseValue && typeof baseValue === "object") {
      if (category in baseValue) {
        interpolated = this.interpolate(baseValue[category], values) ?? baseKey;
      }
      else if ("other" in baseValue) {
        this.config.devMode && console.warn(`[LocL] Missing plural: "${baseKey}" in "${this.language}"`);
        interpolated = this.interpolate(baseValue.other, values) ?? baseKey;
      }
      else {
        this.config.devMode && console.warn(`[LocL] Missing plural: "${baseKey}" in "${this.language}"`);
        interpolated = baseKey;
      }
    }
    else {
      // _one/_other plural
      const pluralKey = `${baseKey}_${category}`;
      const result = this.lookupWithFallback(pluralKey) ?? this.lookupWithFallback(`${baseKey}_other`) ?? this.lookupWithFallback(baseKey);
      interpolated = this.interpolate(result, values) ?? baseKey;
    }

    if (format && format.formatter) {
      return this.applyFormat(interpolated, format.formatter, format.args);
    }
    return interpolated;
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
    if (!key) { return base; }
    return this.lookupWithFallback(key, base);
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
    const language = value.substring(0, 2) as Language<T>;
    return Object.keys(this.config.resources).includes(language) ? language : null;
  }

  private getCacheKey(language?: Language<T>) {
    const scopeKey = Array.isArray(this.scope) ? this.scope.join("|") : this.scope ?? "*";
    return `${language ?? this.language}::${scopeKey}`;
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
    const langObject = this.config.resources[language];
    if (!this.scope) { return langObject; }

    const cacheKey = this.getCacheKey(language);
    if (this.config.useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as object;
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
      const roCombined = this.makeReadOnly(combined);
      if (this.config.useCache) { this.cache.set(cacheKey, roCombined); }
      return roCombined;
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
      if (current.hasOwnProperty(keyTest)) { return current[keyTest]; }
      if (!(key in current)) { return undefined; }
      current = current[key as never];
      keysCopy.shift();
    }
    return current;
  }

  private checkPlural(key: string, values?: InterpolationOptions) {
    if (values?.count !== undefined && !key.match(/_(one|few|many|other)$/)) {
      const category = this.pluralRules.select(values.count);
      const pluralKey = `${key}_${category}`;
      const pluralResult = this.lookupWithFallback(pluralKey);
      return this.interpolate(pluralResult, values);
    }
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
          tokens.push({ raw, inner: raw.slice(1, -1).trim() });
          start = -1;
        }
      }
    }

    let output = result;
    for (const token of tokens) {
      let replacement = "";

      // ---- SELECT ----
      if (token.inner.includes("select")) {
        // {gender, select, male {He} female {She} other {They}}
        const [field, type, ...rest] = token.inner.split(",").map(x => x.trim());
        if (type === "select") {
          const value = String(values[field] ?? "other");
          const caseRegex = /(\w+)\s*\{([^}]*)\}/g;
          const caseMap: Record<string, string> = {};
          let match: RegExpExecArray | null;
          while ((match = caseRegex.exec(rest.join(" "))) !== null) {
            const [, key, text] = match;
            caseMap[key] = text.trim();
          }
          replacement = caseMap[value] ?? caseMap.other ?? "";
        }
      }
      else {
        // ---- Interpolation and formatting ----
        const [fieldName, formatterAndArgs] = token.inner.split("|").map(x => x.trim());
        const [formatterName, argsStr] = formatterAndArgs ? formatterAndArgs.split(":") : [];
        const args = argsStr ? argsStr.split(",") : [];
        const val = values[fieldName];
        if (formatterName && this.formatters?.[formatterName]) {
          replacement = this.formatters[formatterName](val, args);
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
      output = output.replace(token.raw, replacement);
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
        return (val && typeof val === "object")
          ? self.makeReadOnly(val)
          : val;
      },
      set: () => false,
      deleteProperty: () => false,
      defineProperty: () => false,
      setPrototypeOf: () => false
    });
    this.proxyCache.set(obj, proxy);
    return proxy;
  }
}
