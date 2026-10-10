"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  LocL: () => LocL,
  defineResources: () => defineResources,
  initLocL: () => initLocL
});
module.exports = __toCommonJS(src_exports);

// src/formatters.ts
var defaultFormatters = {
  /**
   * Converts a string to uppercase.
   * @param val - The value to format.
   * @returns The uppercased string.
   */
  upper: (val) => String(val).toUpperCase(),
  /**
   * Converts a string to lowercase.
   * @param val - The value to format.
   * @returns The lowercased string.
   */
  lower: (val) => String(val).toLowerCase(),
  /**
   * Capitalizes the first letter of a string.
   * @param val - The value to format.
   * @returns The capitalized string.
   */
  capitalize: (val) => String(val).charAt(0).toUpperCase() + String(val).slice(1),
  /**
   * Trims whitespace from the beginning and end of a string.
   * @param val - The value to format.
   * @returns The trimmed string.
   */
  trim: (val) => String(val).trim(),
  /**
   * Truncates a string to a specified length.
   * @param val - The value to format.
   * @param args - An array of arguments.
   * @param {number} [args[0]=10] - The maximum length of the string.
   * @param {string} [args[1]="..."] - The suffix to append if the string is truncated.
   * @returns The truncated string.
   */
  truncate: (val, args = []) => {
    const length = parseInt(args[0]) || 10;
    const suffix = args[1] || "...";
    const str = String(val);
    return str.length > length ? str.slice(0, length) + suffix : str;
  },
  /**
   * Formats a number using `Intl.NumberFormat`.
   * @param val - The value to format.
   * @param args - An array of arguments.
   * @param {string} [args[0]] - The locale to use.
   * @param {string} [args[1]] - The style of formatting to use (e.g., "decimal", "percent").
   * @returns The formatted number.
   */
  number: (val, args = []) => {
    const locales = args[0] || void 0;
    const options = {};
    if (args[1]) options.style = args[1];
    return new Intl.NumberFormat(locales, options).format(Number(val));
  },
  /**
   * Formats a number as a currency string using `Intl.NumberFormat`.
   * @param val - The value to format.
   * @param args - An array of arguments.
   * @param {string} [args[0]="USD"] - The currency code.
   * @param {string} [args[1]] - The locale to use.
   * @returns The formatted currency string.
   */
  currency: (val, args = []) => {
    const currency = args[0] || "USD";
    const locales = args[1] || void 0;
    return new Intl.NumberFormat(locales, {
      style: "currency",
      currency
    }).format(Number(val));
  },
  /**
   * Formats a date using `Intl.DateTimeFormat`.
   * @param val - The value to format.
   * @param args - An array of arguments.
   * @param {string} [args[0]] - The locale to use.
   * @param {string} [args[1]] - The date style to use (e.g., "short", "long").
   * @returns The formatted date string.
   */
  date: (val, args = []) => {
    const locales = args[0] || void 0;
    const options = {};
    if (args[1]) options.dateStyle = args[1];
    return new Intl.DateTimeFormat(locales, options).format(new Date(val));
  },
  /**
   * Formats a date as a relative time string (e.g., "2 hours ago").
   * @param val - The value to format.
   * @param args - An array of arguments.
   * @param {string} [args[0]] - The locale to use.
   * @returns The relative time string.
   */
  relativeDate: (val, args = []) => {
    const locales = args[0] || void 0;
    const options = { numeric: "auto" };
    const rtf = new Intl.RelativeTimeFormat(locales, options);
    const diff = (new Date(val).getTime() - Date.now()) / 1e3;
    if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), "seconds");
    if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), "minutes");
    if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), "hours");
    return rtf.format(Math.round(diff / 86400), "days");
  },
  /**
   * Converts a value to a JSON string.
   * @param val - The value to format.
   * @returns The JSON string.
   */
  json: (val) => JSON.stringify(val, null, 2),
  /**
   * Converts a boolean value to a "Yes" or "No" string.
   * @param val - The value to format.
   * @param args - An array of arguments.
   * @param {string} [args[0]="Yes"] - The string to return for a truthy value.
   * @param {string} [args[1]="No"] - The string to return for a falsy value.
   * @returns "Yes" or "No".
   */
  yesNo: (val, args = []) => {
    const [yesVal, noVal] = args || [];
    return val ? yesVal || "Yes" : noVal || "No";
  },
  /**
   * Converts a boolean value to a "true" or "false" string.
   * @param val - The value to format.
   * @param args - An array of arguments.
   * @param {string} [args[0]="true"] - The string to return for a truthy value.
   * @param {string} [args[1]="false"] - The string to return for a falsy value.
   * @returns "true" or "false".
   */
  boolean: (val, args = []) => {
    const [trueVal, falseVal] = args || [];
    return val ? trueVal || "true" : falseVal || "false";
  },
  /**
   * Pads the start of a string with another string.
   * @param val - The value to format.
   * @param args - An array of arguments.
   * @param {number} [args[0]=0] - The target length of the string.
   * @param {string} [args[1]=" "] - The string to pad with.
   * @returns The padded string.
   */
  padStart: (val, args = []) => {
    const length = parseInt(args[0]) || 0;
    const fill = args[1] || " ";
    return String(val).padStart(length, fill);
  },
  /**
   * Pads the end of a string with another string.
   * @param val - The value to format.
   * @param args - An array of arguments.
   * @param {number} [args[0]=0] - The target length of the string.
   * @param {string} [args[1]=" "] - The string to pad with.
   * @returns The padded string.
   */
  padEnd: (val, args = []) => {
    const length = parseInt(args[0]) || 0;
    const fill = args[1] || " ";
    return String(val).padEnd(length, fill);
  }
};

// src/LocL.ts
var LocL = class _LocL {
  /**
   * Creates a new LocL instance.
   * @param config - The configuration object.
   */
  constructor(config) {
    this.rootInstance = this;
    this.cache = /* @__PURE__ */ new Map();
    this.proxyCache = /* @__PURE__ */ new WeakMap();
    this.pluralRulesCache = /* @__PURE__ */ new Map();
    this.subscribers = /* @__PURE__ */ new Set();
    this.loadedNamespaces = /* @__PURE__ */ new Set();
    this.loadedLanguages = /* @__PURE__ */ new Set();
    this.loadingPromises = /* @__PURE__ */ new Map();
    this.version = 0;
    if (!config.resources) {
      throw new Error("[LocL] `resources` is required");
    }
    if (!config.fallbackLanguage) {
      throw new Error("[LocL] `fallbackLanguage` is required");
    }
    this.config = {
      useDefaultFormatters: true,
      devMode: false,
      useCache: true,
      ...config
    };
    this.resources = { ...config.resources };
    this.language = this.isLanguage(config.language) ?? config.fallbackLanguage;
    this.fallbackLanguage = config.fallbackLanguage;
    this.scope = config.scope;
    this.loader = config.loader;
    this.formatters = this.config.useDefaultFormatters ? { ...defaultFormatters, ...config.formatters ?? {} } : { ...config.formatters ?? {} };
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
  withConfig(config) {
    const root = this.rootInstance;
    const cacheKey = `proxy::${config.language ?? this.language}::${Array.isArray(config.scope) ? config.scope.join("|") : config.scope ?? "*"}`;
    if (root.cache.has(cacheKey)) {
      return root.cache.get(cacheKey);
    }
    const result = new Proxy(root, {
      get(target, prop, receiver) {
        if (prop === "language") {
          return config.language ?? target.language;
        }
        if (prop === "scope") {
          return config.scope !== void 0 ? config.scope : target.scope;
        }
        if (prop === "rootInstance") {
          return target;
        }
        if (prop === "subscribe" && config.language !== void 0) {
          return (listener) => {
            try {
              listener(config.language, config.language);
            } catch (err) {
              console.error("[LocL] Error in subscriber:", err);
            }
            return () => {
            };
          };
        }
        return Reflect.get(target, prop, receiver);
      }
    });
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
  clone(language = this.language, scope) {
    return new _LocL({
      ...this.config,
      resources: this.resources,
      language,
      scope
    });
  }
  /**
   * Subscribes a listener to language changes.
   * Conforms to the standard reactive store contract (e.g. Svelte stores).
   * Calls the listener immediately with the current language and returns an unsubscribe function.
   * @param listener - The subscriber callback function.
   * @returns An unsubscribe function.
   */
  subscribe(listener) {
    this.subscribers.add(listener);
    try {
      listener(this.language, this.language);
    } catch (err) {
      console.error("[LocL] Error in initial subscriber call:", err);
    }
    return () => {
      this.subscribers.delete(listener);
    };
  }
  /**
   * Gets the current active language.
   */
  getLanguage() {
    return this.language;
  }
  getVersion() {
    return this.version;
  }
  /**
   * Checks if an entire language or specific namespace is loaded.
   */
  isLoaded(lang = this.language, namespace) {
    if (namespace) {
      const key = `${lang}::${namespace}`;
      if (this.loadedNamespaces.has(key)) return true;
      const langObj = this.resources[lang];
      if (langObj && typeof langObj === "object") {
        return namespace.split(".").reduce((acc, k) => acc?.[k], langObj) !== void 0;
      }
      return false;
    }
    return this.loadedLanguages.has(lang) || Object.keys(this.resources[lang] ?? {}).length > 0;
  }
  /**
   * Resolves raw data from JSON, TS/JS modules, functions, or fetch Responses into a clean dictionary object.
   */
  async resolveBundle(raw, namespace) {
    let data = raw;
    if (typeof Response !== "undefined" && data instanceof Response) {
      data = await data.json();
    }
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
      }
    }
    if (data && typeof data === "object" && "default" in data) {
      data = data.default;
    }
    if (typeof data === "function") {
      data = await data();
    }
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
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  }
  /**
   * Loads a full language file (e.g. `de.json`) or a namespace (e.g. `de/dashboard.json`).
   * Supports both monolithic files and modular namespaces.
   */
  async load(lang = this.language, namespace, loader = this.loader) {
    if (this.isLoaded(lang, namespace)) {
      return;
    }
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
          const nested = {};
          namespace.split(".").reduce((acc, k, i, arr) => {
            acc[k] = i === arr.length - 1 ? bundle : {};
            return acc[k];
          }, nested);
          this.addResources(lang, nested);
          this.loadedNamespaces.add(key);
        } else {
          this.addResources(lang, bundle);
          this.loadedLanguages.add(lang);
        }
      } finally {
        this.loadingPromises.delete(key);
      }
    })();
    this.loadingPromises.set(key, loadPromise);
    return loadPromise;
  }
  loadLanguage(lang, loader) {
    return this.load(lang, void 0, loader);
  }
  loadNamespace(namespace, lang = this.language, loader) {
    return this.load(lang, namespace, loader);
  }
  /**
   * Adds or overrides a single translation key at runtime.
   * @param lang - Target language code.
   * @param key - Dotted path key.
   * @param value - The translation value.
   */
  addResource(lang, key, value) {
    if (this.isUnsafeObjectKey(lang)) {
      return;
    }
    const keys = key.split(".");
    if (keys.some((k) => this.isUnsafeObjectKey(k))) {
      return;
    }
    if (!this.resources[lang]) {
      this.resources[lang] = /* @__PURE__ */ Object.create(null);
    }
    let current = this.resources[lang];
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== "object") {
        current[k] = /* @__PURE__ */ Object.create(null);
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
  addResources(lang, bundle) {
    if (this.isUnsafeObjectKey(lang)) {
      return this;
    }
    if (!this.resources[lang]) {
      this.resources[lang] = /* @__PURE__ */ Object.create(null);
    }
    const deepMerge = (target, source) => {
      for (const k of Object.keys(source)) {
        if (this.isUnsafeObjectKey(k)) {
          continue;
        }
        if (source[k] && typeof source[k] === "object" && !Array.isArray(source[k])) {
          if (!target[k] || typeof target[k] !== "object") {
            target[k] = /* @__PURE__ */ Object.create(null);
          }
          deepMerge(target[k], source[k]);
        } else {
          target[k] = source[k];
        }
      }
    };
    deepMerge(this.resources[lang], bundle);
    this.invalidateCacheForLang(lang);
    this.version++;
    this.notifySubscribers();
    return this;
  }
  /**
   * Changes the current language of the translator.
   * @param lang - The new language to set.
   */
  changeLanguage(lang) {
    const validated = this.isLanguage(lang);
    if (validated && validated !== this.language) {
      const prev = this.language;
      this.language = validated;
      this.version++;
      for (const sub of this.subscribers) {
        try {
          sub(this.language, prev);
        } catch (err) {
          console.error("[LocL] Error in subscriber:", err);
        }
      }
    }
  }
  t(key, values, format) {
    if (!key) {
      return this.get();
    }
    const pluralCheckResult = this.checkPlural(key, values);
    if (pluralCheckResult !== void 0) {
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
  tt(key, values, format) {
    return this.t(key, values, format);
  }
  /**
   * Formats a value using a specific formatter.
   * @param value - The value to format.
   * @param formatter - The name of the formatter to use.
   * @param args - An array of arguments to pass to the formatter.
   * @returns The formatted string.
   */
  format(value, formatter, args) {
    return this.applyFormat(value, formatter, args);
  }
  plural(key, values, format) {
    return this.t(key, values, format);
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
  rich(key, tags, values) {
    const rawStr = this.t(key, values);
    if (typeof rawStr !== "string") {
      return [rawStr];
    }
    const tagRegex = /<([a-zA-Z0-9_-]+)>([\s\S]*?)<\/\1>/g;
    const result = [];
    let lastIndex = 0;
    let match;
    while ((match = tagRegex.exec(rawStr)) !== null) {
      if (match.index > lastIndex) {
        result.push(rawStr.slice(lastIndex, match.index));
      }
      const tagName = match[1];
      const content = match[2];
      const renderer = tags[tagName];
      typeof renderer === "function" ? result.push(renderer(content)) : result.push(match[0]);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < rawStr.length) {
      result.push(rawStr.slice(lastIndex));
    }
    return result;
  }
  get(key) {
    const base = this.buildTranslationObject(this.language);
    if (!key) {
      return base ? this.makeReadOnly(base) : void 0;
    }
    const val = this.lookupWithFallback(key, base);
    return val && typeof val === "object" ? this.makeReadOnly(val) : val;
  }
  /**
   * Gets a nested object from the translations.
   * This is a type-safe way to get a nested object.
   * @param key - The key of the object to get.
   * @returns The nested translation object, or `undefined` if not found.
   */
  getObj(key) {
    return this.get(key);
  }
  isLanguage(value) {
    if (!value) {
      return null;
    }
    const available = Object.keys(this.resources);
    if (available.includes(value)) {
      return value;
    }
    const prefix = value.substring(0, 2);
    if (available.includes(prefix)) {
      return prefix;
    }
    return null;
  }
  getCacheKey(language) {
    const scopeKey = Array.isArray(this.scope) ? this.scope.join("|") : this.scope;
    return `${language}::${scopeKey}`;
  }
  invalidateCacheForLang(lang) {
    const prefix = `${lang}::`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
  lookupWithFallback(key, base) {
    const keys = key.split(".");
    let result = this.findTranslation(keys, base ?? this.buildTranslationObject(this.language));
    if (result === void 0 && this.config.devMode) {
      console.warn(`[LocL] Missing key: "${key}" in "${this.language}"`);
    }
    if (result === void 0) {
      const fbBase = this.buildTranslationObject(this.fallbackLanguage);
      result = this.findTranslation(keys, fbBase);
    }
    if (result === void 0 && this.config.devMode) {
      console.warn(`[LocL] Missing key: "${key}" in "${this.fallbackLanguage}"`);
    }
    return result;
  }
  buildTranslationObject(language) {
    const langObject = this.resources[language];
    if (!this.scope) {
      return langObject;
    }
    const cacheKey = this.getCacheKey(language);
    if (this.config.useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    if (typeof this.scope === "string") {
      const result = this.scope.split(".").reduce((acc, k) => acc?.[k], langObject);
      if (this.config.useCache) {
        this.cache.set(cacheKey, result);
      }
      result === void 0 && this.config.devMode && console.warn(`[LocL] Missing namespace: "${this.scope}" in "${this.language}"`);
      return result;
    }
    if (Array.isArray(this.scope)) {
      const combined = {};
      for (const mod of this.scope) {
        const val = mod.split(".").reduce((acc, k) => acc?.[k], langObject);
        if (val) {
          mod.split(".").reduce((acc, k, i, arr) => {
            if (i === arr.length - 1) {
              acc[k] = val;
            } else {
              acc[k] ?? (acc[k] = {});
            }
            return acc[k];
          }, combined);
        }
      }
      if (this.config.useCache) {
        this.cache.set(cacheKey, combined);
      }
      return combined;
    }
    if (this.config.useCache) {
      this.cache.set(cacheKey, void 0);
    }
    this.config.devMode && console.warn(`[LocL] Missing namespace: "${this.scope}" in "${this.language}"`);
    return void 0;
  }
  findTranslation(keys, translationObject) {
    if (!translationObject || typeof translationObject !== "object") {
      return void 0;
    }
    let current = translationObject;
    const keysCopy = [...keys];
    for (const key of keys) {
      if (current === null || typeof current !== "object") {
        return void 0;
      }
      const keyTest = keysCopy.join(".");
      if (Object.prototype.hasOwnProperty.call(current, keyTest)) {
        return current[keyTest];
      }
      if (!(key in current)) {
        return void 0;
      }
      current = current[key];
      keysCopy.shift();
    }
    return current;
  }
  getPluralRules(lang) {
    let rules = this.pluralRulesCache.get(lang);
    if (!rules) {
      rules = new Intl.PluralRules(lang);
      this.pluralRulesCache.set(lang, rules);
    }
    return rules;
  }
  checkPlural(key, values) {
    if (values?.count !== void 0 && !key.match(/_(zero|one|two|few|many|other)$/)) {
      const category = this.getPluralRules(this.language).select(values.count);
      const baseValue = this.lookupWithFallback(key, void 0);
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
      if (values.count === 0) {
        const zeroResult = this.lookupWithFallback(`${key}_zero`, void 0);
        if (zeroResult !== void 0) {
          return this.interpolate(zeroResult, values);
        }
      }
      const categoryResult = this.lookupWithFallback(`${key}_${category}`, void 0);
      if (categoryResult !== void 0) {
        return this.interpolate(categoryResult, values);
      }
      const otherResult = this.lookupWithFallback(`${key}_other`, void 0);
      if (otherResult !== void 0) {
        this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
        return this.interpolate(otherResult, values);
      }
      const anySuffixExists = ["zero", "one", "two", "few", "many"].some((cat) => this.lookupWithFallback(`${key}_${cat}`, void 0) !== void 0);
      if (anySuffixExists) {
        this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
        return key;
      }
    }
    return void 0;
  }
  interpolate(result, values) {
    if (!values || typeof result !== "string") {
      return result;
    }
    const tokens = [];
    let depth = 0, start = -1;
    for (let i = 0; i < result.length; i++) {
      if (result[i] === "{") {
        if (depth === 0) {
          start = i;
        }
        depth++;
      } else if (result[i] === "}") {
        depth--;
        if (depth === 0 && start >= 0) {
          const raw = result.slice(start, i + 1);
          let inner = raw.slice(1, -1);
          if (inner.startsWith("{") && inner.endsWith("}")) {
            inner = inner.slice(1, -1);
          }
          tokens.push({ raw, inner });
          start = -1;
        }
      }
    }
    let output = result;
    const processed = /* @__PURE__ */ new Set();
    for (const token of tokens) {
      if (processed.has(token.raw)) {
        continue;
      }
      processed.add(token.raw);
      let replacement = "";
      const selectMatch = token.inner.match(/^\s*([^,]+),\s*select\s*,\s*([\s\S]+)$/);
      if (selectMatch) {
        const field = selectMatch[1].trim();
        const casesBody = selectMatch[2];
        const value = String(values[field] ?? "other");
        const caseMap = {};
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
      } else {
        const [fieldName, formatterAndArgs] = token.inner.split("|").map((x) => x.trim());
        const [formatterName, argsStr] = formatterAndArgs ? formatterAndArgs.split(":") : [];
        const args = argsStr ? argsStr.split(",").map((a) => a.trim()) : [];
        const val = values[fieldName];
        if (formatterName) {
          if (this.formatters?.[formatterName]) {
            replacement = this.formatters[formatterName](val, args);
          } else {
            this.config.devMode && console.warn(`[LocL] Formatter "${formatterName}" not found.`);
            replacement = val !== void 0 ? String(val) : token.raw;
          }
        } else if (val instanceof Date) {
          replacement = new Intl.DateTimeFormat(this.language).format(val);
        } else if (typeof val === "number") {
          replacement = new Intl.NumberFormat(this.language).format(val);
        } else {
          replacement = val !== void 0 ? String(val) : token.raw;
        }
      }
      output = output.split(token.raw).join(replacement);
    }
    return output;
  }
  applyFormat(value, formatter, args) {
    const formatterFn = this.formatters?.[formatter];
    if (!formatterFn) {
      this.config.devMode && console.warn(`[LocL] Formatter "${formatter.toString()}" not found.`);
      return value;
    }
    return formatterFn(value, args);
  }
  makeReadOnly(obj) {
    const self = this;
    if (this.proxyCache.has(obj)) {
      return this.proxyCache.get(obj);
    }
    const proxy = new Proxy(obj, {
      get(target, prop, receiver) {
        const val = Reflect.get(target, prop, receiver);
        return val && typeof val === "object" ? self.makeReadOnly(val) : val;
      },
      set: () => false,
      deleteProperty: () => false,
      defineProperty: () => false,
      setPrototypeOf: () => false
    });
    this.proxyCache.set(obj, proxy);
    return proxy;
  }
  notifySubscribers() {
    for (const sub of this.subscribers) {
      try {
        sub(this.language, this.language);
      } catch (err) {
        console.error("[LocL] Error in subscriber:", err);
      }
    }
  }
  isUnsafeObjectKey(key) {
    return key === "__proto__" || key === "constructor" || key === "prototype";
  }
};

// src/index.ts
function initLocL(config) {
  return new LocL(config);
}
function defineResources(resources) {
  return resources;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LocL,
  defineResources,
  initLocL
});
