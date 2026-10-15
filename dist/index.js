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
    const num = Number(val);
    if (isNaN(num)) {
      return String(val);
    }
    return new Intl.NumberFormat(locales, options).format(num);
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
    const num = Number(val);
    if (isNaN(num)) {
      return String(val);
    }
    return new Intl.NumberFormat(locales, {
      style: "currency",
      currency
    }).format(val);
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
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      return String(val);
    }
    return new Intl.DateTimeFormat(locales, options).format(d);
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
    const time = new Date(val).getTime();
    if (isNaN(time)) {
      return String(val);
    }
    const diff = (time - Date.now()) / 1e3;
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
var PSEUDO_ACCENT_MAP = {
  a: "\xE1",
  b: "\u1E05",
  c: "\xE7",
  d: "\u0111",
  e: "\xE9",
  f: "\u0192",
  g: "\u011F",
  h: "\u1E29",
  i: "\xED",
  j: "\u0135",
  k: "\u0137",
  l: "\u013C",
  m: "\u0271",
  n: "\xF1",
  o: "\xF6",
  p: "\xFE",
  q: "\u01EB",
  r: "\u0155",
  s: "\u0161",
  t: "\u0163",
  u: "\xFA",
  v: "\u1E7D",
  w: "\u0175",
  x: "\u1E8B",
  y: "\xFD",
  z: "\u017E",
  A: "\xC1",
  B: "\u1E04",
  C: "\xC7",
  D: "\xD0",
  E: "\xC9",
  F: "\u0191",
  G: "\u011E",
  H: "\u1E28",
  I: "\xCD",
  J: "\u0134",
  K: "\u0136",
  L: "\u013B",
  M: "\u1E42",
  N: "\xD1",
  O: "\xD6",
  P: "\xDE",
  Q: "\u01EA",
  R: "\u0154",
  S: "\u0160",
  T: "\u0162",
  U: "\xDA",
  V: "\u1E7C",
  W: "\u0174",
  X: "\u1E8A",
  Y: "\xDD",
  Z: "\u017D"
};
var RTL_SCRIPT_SUBTAGS = /* @__PURE__ */ new Set([
  "arab",
  "hebr",
  "syrc",
  "samr",
  "mand",
  "thaa",
  "mend",
  "nkoo",
  "adlm",
  "rohg",
  "yezi"
]);
var RTL_PRIMARY_LANGUAGES = /* @__PURE__ */ new Set([
  "ar",
  "arc",
  "bcc",
  "bqi",
  "ckb",
  "dv",
  "fa",
  "glk",
  "he",
  "iw",
  "khw",
  "ks",
  "ku",
  "mzn",
  "pnb",
  "ps",
  "sd",
  "ug",
  "ur",
  "yi",
  "ji"
]);
var MAX_TEMPLATE_CACHE = 1e3;
var MAX_SCOPE_CACHE = 500;
var LocL = class _LocL {
  /**
   * Creates a new LocL instance.
   * @param config - The configuration object.
   */
  constructor(config) {
    this.rootInstance = this;
    this.cache = /* @__PURE__ */ new Map();
    this.templateCache = /* @__PURE__ */ new Map();
    this.proxyCache = /* @__PURE__ */ new WeakMap();
    this.pluralRulesCache = /* @__PURE__ */ new Map();
    this.dateTimeFormatCache = /* @__PURE__ */ new Map();
    this.numberFormatCache = /* @__PURE__ */ new Map();
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
      autoSyncDocument: true,
      ...config
    };
    this.resources = { ...config.resources };
    this.fallbackLanguage = config.fallbackLanguage;
    this.language = this.validateSupportedLanguage(config.language) ?? config.fallbackLanguage;
    this.scope = config.scope;
    this.loader = config.loader;
    config.pseudoLocalization && this.setPseudoLocalization(config.pseudoLocalization);
    this.formatters = this.config.useDefaultFormatters ? { ...defaultFormatters, ...config.formatters ?? {} } : { ...config.formatters ?? {} };
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
        if (prop === "getLanguage") {
          return () => config.language ?? target.language;
        }
        if (prop === "getDirection") {
          return (lang) => target.getDirection(lang ?? config.language ?? target.language);
        }
        if (prop === "isRTL") {
          return (lang) => target.isRTL(lang ?? config.language ?? target.language);
        }
        if (prop === "getMetadata") {
          return (lang) => target.getMetadata(lang ?? config.language ?? target.language);
        }
        if (prop === "subscribe" && config.language !== void 0) {
          return (listener) => {
            try {
              listener(config.language, config.language, target.getMetadata(config.language));
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
      if (root.cache.size >= MAX_SCOPE_CACHE) {
        const keysToDelete = Array.from(root.cache.keys()).slice(0, 100);
        for (const k of keysToDelete) {
          root.cache.delete(k);
        }
      }
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
      listener(this.language, this.language, this.getMetadata());
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
  getDirection(lang = this.language) {
    if (!lang) {
      return "ltr";
    }
    try {
      const locale = new Intl.Locale(lang);
      const info = typeof locale.getTextInfo === "function" ? locale.getTextInfo() : locale.textInfo;
      if (info && (info.direction === "rtl" || info.direction === "ltr")) {
        return info.direction;
      }
    } catch {
    }
    const normalized = lang.toLowerCase().replace(/_/g, "-");
    const parts = normalized.split("-");
    const primary = parts[0];
    const script = parts.find((p) => p.length === 4);
    if (script) {
      return RTL_SCRIPT_SUBTAGS.has(script) ? "rtl" : "ltr";
    }
    return RTL_PRIMARY_LANGUAGES.has(primary) ? "rtl" : "ltr";
  }
  isRTL(lang = this.language) {
    return this.getDirection(lang) === "rtl";
  }
  getMetadata(lang = this.language) {
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
  getFallbackChain(lang = this.language) {
    const chain = [];
    let current = lang;
    while (current) {
      chain.push(current);
      const lastSeparator = Math.max(current.lastIndexOf("-"), current.lastIndexOf("_"));
      if (lastSeparator === -1) {
        break;
      }
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
  isLoaded(lang = this.language, namespace) {
    if (namespace) {
      const key = `${lang}::${namespace}`;
      if (this.loadedNamespaces.has(key)) {
        return true;
      }
      const langObj = this.resources[lang];
      if (langObj && typeof langObj === "object") {
        return namespace.split(".").reduce((acc, k) => acc?.[k], langObj) !== void 0;
      }
      return false;
    }
    return this.loadedLanguages.has(lang) || Object.keys(this.resources[lang] ?? {}).length > 0;
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
      const raw = await loader(lang, namespace);
      const bundle = await this.resolveRawBundle(raw, namespace);
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
    if (typeof lang !== "string" || typeof key !== "string" || this.isUnsafeObjectKey(lang)) {
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(this.resources, lang) || !this.resources[lang] || typeof this.resources[lang] !== "object") {
      this.resources[lang] = /* @__PURE__ */ Object.create(null);
    }
    const keys = key.split(".");
    let current = this.resources[lang];
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (this.isUnsafeObjectKey(k)) {
        return;
      }
      if (!Object.prototype.hasOwnProperty.call(current, k) || typeof current[k] !== "object" || current[k] === null) {
        current[k] = /* @__PURE__ */ Object.create(null);
      }
      current = current[k];
    }
    const lastKey = keys[keys.length - 1];
    if (this.isUnsafeObjectKey(lastKey)) {
      return;
    }
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
  addResources(lang, bundle) {
    if (typeof lang !== "string" || this.isUnsafeObjectKey(lang)) {
      return this;
    }
    if (!Object.prototype.hasOwnProperty.call(this.resources, lang) || !this.resources[lang] || typeof this.resources[lang] !== "object") {
      this.resources[lang] = /* @__PURE__ */ Object.create(null);
    }
    const deepMerge = (target, source) => {
      for (const k of Object.keys(source)) {
        if (this.isUnsafeObjectKey(k)) {
          continue;
        }
        if (source[k] && typeof source[k] === "object" && !Array.isArray(source[k])) {
          if (!Object.prototype.hasOwnProperty.call(target, k) || !target[k] || typeof target[k] !== "object") {
            target[k] = /* @__PURE__ */ Object.create(null);
          }
          deepMerge(target[k], source[k]);
        } else {
          target[k] = source[k];
        }
      }
    };
    deepMerge(this.resources[lang], bundle);
    this.invalidateCacheForLanguage(lang);
    this.version++;
    this.notifySubscribers();
    return this;
  }
  /**
   * Changes the current language of the translator.
   * @param lang - The new language to set.
   */
  changeLanguage(lang) {
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
    const pluralResult = this.resolvePluralKey(key, values);
    if (pluralResult !== void 0) {
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
    return this.applyNamedFormatter(value, formatter, args);
  }
  plural(key, values, format) {
    return this.t(key, values, format);
  }
  ordinal(key, values, format) {
    return this.t(key, { ...values || {}, ordinal: true }, format);
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
    const tagRegex = /<([a-zA-Z0-9_-]+)(?:\s+[^>]*)?>([\s\S]*?)<\/\1>|<([a-zA-Z0-9_-]+)(?:\s+[^>]*)?\/>/g;
    const result = [];
    let lastIndex = 0;
    let match;
    while ((match = tagRegex.exec(rawStr)) !== null) {
      if (match.index > lastIndex) {
        result.push(rawStr.slice(lastIndex, match.index));
      }
      const isSelfClosing = match[3] !== void 0;
      const tagName = isSelfClosing ? match[3] : match[1];
      const content = isSelfClosing ? "" : match[2];
      const renderer = tags[tagName];
      if (typeof renderer === "function") {
        result.push(renderer(content));
      } else if (renderer !== void 0) {
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
  get(key) {
    const base = this.buildScopedTranslationObject(this.language);
    if (!key) {
      return base ? this.makeReadOnly(base) : void 0;
    }
    const val = this.lookupKeyWithFallback(key, base);
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
  /**
   * Configures or toggles pseudo-localization at runtime.
   */
  setPseudoLocalization(options) {
    if (typeof options === "boolean") {
      this.pseudoOptions = options ? { enabled: true } : void 0;
    } else {
      this.pseudoOptions = options.enabled !== false ? { enabled: true, ...options } : void 0;
    }
    this.cache.clear();
    this.templateCache.clear();
    this.version++;
    this.notifySubscribers();
  }
  /* =========================================================================
   * Fast Template Compilation & Evaluation Engine & Plural Resolution
   * ========================================================================= */
  evaluateTemplate(template, values, isNested = false) {
    if (typeof template !== "string") {
      return template;
    }
    const cacheKey = this.pseudoOptions?.enabled ? `pseudo::${template}` : `raw::${template}`;
    let chunks = this.templateCache.get(cacheKey);
    if (!chunks) {
      chunks = this.compileTemplateIntoChunks(template);
      if (this.config.useCache) {
        if (this.templateCache.size >= MAX_TEMPLATE_CACHE) {
          const keysToDelete = Array.from(this.templateCache.keys()).slice(0, 200);
          for (const k of keysToDelete) {
            this.templateCache.delete(k);
          }
        }
        this.templateCache.set(cacheKey, chunks);
      }
    }
    if (chunks.length === 1 && chunks[0].type === "lit" && !this.pseudoOptions?.enabled) {
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
    if (this.pseudoOptions?.enabled && !isNested) {
      const prefix = this.pseudoOptions.prefix ?? "[!!! ";
      const suffix = this.pseudoOptions.suffix ?? " !!!]";
      return `${prefix}${output}${suffix}`;
    }
    return output;
  }
  compileTemplateIntoChunks(template) {
    const text = template;
    const isPseudo = Boolean(this.pseudoOptions?.enabled);
    const useAccents = this.pseudoOptions?.accents !== false;
    const formatLit = (str) => {
      const unescaped = str.replace(/\\([{}])/g, "$1");
      return isPseudo && useAccents ? this.applyPseudoAccents(unescaped) : unescaped;
    };
    const chunks = [];
    let lastIndex = 0;
    let depth = 0;
    let start = -1;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "\\" && (text[i + 1] === "{" || text[i + 1] === "}")) {
        i++;
        continue;
      }
      if (text[i] === "{") {
        if (depth === 0) {
          if (i > lastIndex) {
            const rawLit = text.slice(lastIndex, i);
            chunks.push({
              type: "lit",
              value: formatLit(rawLit)
            });
          }
          start = i;
        }
        depth++;
      } else if (text[i] === "}") {
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
              const cases = this.parseSelectCases(selectMatch[2], isPseudo && useAccents);
              chunks.push({ type: "select", field, cases });
            } else {
              const [name, ...pipeParts] = inner.split("|").map((s) => s.trim());
              const formatters = pipeParts.map((segment) => {
                const colonIdx = segment.indexOf(":");
                return colonIdx === -1 ? { name: segment.trim(), args: [] } : { name: segment.slice(0, colonIdx).trim(), args: segment.slice(colonIdx + 1).split(",").map((a) => a.trim()) };
              });
              chunks.push({ type: "var", name, raw, formatters });
            }
            lastIndex = i + 1;
            start = -1;
          }
        }
      }
    }
    if (depth > 0 && start >= 0) {
      const remaining = text.slice(start);
      chunks.push({
        type: "lit",
        value: formatLit(remaining)
      });
    } else if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex);
      chunks.push({
        type: "lit",
        value: formatLit(remaining)
      });
    }
    return chunks;
  }
  evaluateVariableChunk(chunk, values) {
    if (!values) {
      return chunk.raw;
    }
    let val = values[chunk.name];
    if (val === void 0) {
      return chunk.raw;
    }
    if (chunk.formatters.length > 0) {
      for (const fmt of chunk.formatters) {
        const fn = this.formatters?.[fmt.name];
        if (fn) {
          val = fn(val, fmt.args);
        } else {
          this.config.devMode && console.warn(`[LocL] Formatter "${fmt.name}" not found.`);
        }
      }
      return val !== void 0 ? String(val) : chunk.raw;
    }
    if (val instanceof Date) {
      return this.getDateTimeFormat(this.language).format(val);
    }
    if (typeof val === "number") {
      return this.getNumberFormat(this.language).format(val);
    }
    return String(val);
  }
  evaluateSelectChunk(chunk, values) {
    const val = values ? String(values[chunk.field] ?? "other") : "other";
    const caseText = chunk.cases[val] ?? chunk.cases.other ?? "";
    return caseText.includes("{") ? this.evaluateTemplate(caseText, values, true) : caseText;
  }
  parseSelectCases(casesBody, pseudoAccents = false) {
    const cases = {};
    let i = 0;
    while (i < casesBody.length) {
      while (i < casesBody.length && /\s/.test(casesBody[i])) {
        i++;
      }
      if (i >= casesBody.length) {
        break;
      }
      let keyStart = i;
      while (i < casesBody.length && casesBody[i] !== "{" && !/\s/.test(casesBody[i])) {
        i++;
      }
      const caseKey = casesBody.slice(keyStart, i).trim();
      while (i < casesBody.length && casesBody[i] !== "{") {
        i++;
      }
      if (casesBody[i] === "{") {
        let depth = 1;
        let bodyStart = i + 1;
        i++;
        while (i < casesBody.length && depth > 0) {
          if (casesBody[i] === "{") {
            depth++;
          } else if (casesBody[i] === "}") {
            depth--;
          }
          i++;
        }
        let caseText = casesBody.slice(bodyStart, i - 1).trim();
        if (pseudoAccents) {
          caseText = this.applyPseudoAccents(caseText);
        }
        if (caseKey) {
          cases[caseKey] = caseText;
        }
      }
    }
    return cases;
  }
  resolvePluralKey(key, values) {
    if (values?.count !== void 0 && !key.match(/_(zero|one|two|few|many|other)$/) && !key.match(/_ordinal_(zero|one|two|few|many|other)$/)) {
      const isOrdinal = Boolean(values.ordinal || values.type === "ordinal");
      const pluralType = isOrdinal ? "ordinal" : "cardinal";
      const exactKey = `=${values.count}`;
      const baseValue = this.lookupKeyWithFallback(key);
      if (baseValue && typeof baseValue === "object") {
        const target = isOrdinal && baseValue.ordinal && typeof baseValue.ordinal === "object" ? baseValue.ordinal : baseValue;
        if (exactKey in target) {
          return this.evaluateTemplate(target[exactKey], values);
        }
        if (values.count === 0 && "zero" in target) {
          return this.evaluateTemplate(target.zero, values);
        }
        const category2 = this.getPluralRules(this.language, pluralType).select(values.count);
        if (category2 in target) {
          return this.evaluateTemplate(target[category2], values);
        }
        if ("other" in target) {
          this.config.onMissingKey?.(key, this.language, this.getFallbackChain(this.language));
          this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
          return this.evaluateTemplate(target.other, values);
        }
        this.config.onMissingKey?.(key, this.language, this.getFallbackChain(this.language));
        this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
        return key;
      }
      if (isOrdinal) {
        const exactOrdinalSuffix = this.lookupKeyWithFallback(`${key}_ordinal_${exactKey}`);
        if (exactOrdinalSuffix !== void 0) {
          return this.evaluateTemplate(exactOrdinalSuffix, values);
        }
      }
      const exactSuffixValue = this.lookupKeyWithFallback(`${key}_${exactKey}`);
      if (exactSuffixValue !== void 0) {
        return this.evaluateTemplate(exactSuffixValue, values);
      }
      if (values.count === 0) {
        if (isOrdinal) {
          const zeroOrdinalSuffix = this.lookupKeyWithFallback(`${key}_ordinal_zero`);
          if (zeroOrdinalSuffix !== void 0) {
            return this.evaluateTemplate(zeroOrdinalSuffix, values);
          }
        }
        const zeroSuffixValue = this.lookupKeyWithFallback(`${key}_zero`);
        if (zeroSuffixValue !== void 0) {
          return this.evaluateTemplate(zeroSuffixValue, values);
        }
      }
      const category = this.getPluralRules(this.language, pluralType).select(values.count);
      if (isOrdinal) {
        const categoryOrdinalSuffix = this.lookupKeyWithFallback(`${key}_ordinal_${category}`);
        if (categoryOrdinalSuffix !== void 0) {
          return this.evaluateTemplate(categoryOrdinalSuffix, values);
        }
      }
      const categorySuffixValue = this.lookupKeyWithFallback(`${key}_${category}`);
      if (categorySuffixValue !== void 0) {
        return this.evaluateTemplate(categorySuffixValue, values);
      }
      if (isOrdinal) {
        const otherOrdinalSuffix = this.lookupKeyWithFallback(`${key}_ordinal_other`);
        if (otherOrdinalSuffix !== void 0) {
          this.config.onMissingKey?.(key, this.language, this.getFallbackChain(this.language));
          this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
          return this.evaluateTemplate(otherOrdinalSuffix, values);
        }
      }
      const otherSuffixValue = this.lookupKeyWithFallback(`${key}_other`);
      if (otherSuffixValue !== void 0) {
        this.config.onMissingKey?.(key, this.language, this.getFallbackChain(this.language));
        this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
        return this.evaluateTemplate(otherSuffixValue, values);
      }
      const anySuffixExists = ["zero", "one", "two", "few", "many"].some(
        (cat) => isOrdinal && this.lookupKeyWithFallback(`${key}_ordinal_${cat}`) !== void 0 || this.lookupKeyWithFallback(`${key}_${cat}`) !== void 0
      );
      if (anySuffixExists) {
        this.config.onMissingKey?.(key, this.language, this.getFallbackChain(this.language));
        this.config.devMode && console.warn(`[LocL] Missing plural: "${key}" in "${this.language}"`);
        return key;
      }
    }
    return void 0;
  }
  /* =========================================================================
   * Internal Lookups, Formatters & DOM Helpers
   * ========================================================================= */
  validateSupportedLanguage(value) {
    if (!value) {
      return null;
    }
    const available = Object.keys(this.resources);
    let current = value;
    while (current) {
      if (available.includes(current)) {
        return current;
      }
      const lastSeparator = Math.max(current.lastIndexOf("-"), current.lastIndexOf("_"));
      if (lastSeparator === -1) {
        break;
      }
      current = current.slice(0, lastSeparator);
    }
    const prefix = value.substring(0, 2);
    if (available.includes(prefix)) {
      return prefix;
    }
    return null;
  }
  buildLanguageScopeCacheKey(language) {
    const scopeKey = Array.isArray(this.scope) ? this.scope.join("|") : this.scope;
    return `${language}::${scopeKey}`;
  }
  invalidateCacheForLanguage(lang) {
    const prefix = `${lang}::`;
    const proxyPrefix = `proxy::${lang}::`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix) || key.startsWith(proxyPrefix)) {
        this.cache.delete(key);
      }
    }
  }
  lookupKeyWithFallback(key, base) {
    const keys = key.split(".");
    if (base) {
      const res = this.findNestedValue(keys, base);
      if (res !== void 0) {
        return res;
      }
    }
    const chain = this.getFallbackChain(this.language);
    for (const lang of chain) {
      const langObj = this.buildScopedTranslationObject(lang);
      if (!langObj) {
        continue;
      }
      const res = this.findNestedValue(keys, langObj);
      if (res !== void 0) {
        return res;
      }
    }
    this.config.onMissingKey?.(key, this.language, chain);
    if (this.config.devMode) {
      console.warn(`[LocL] Missing key: "${key}" in "${this.language}" (fallback chain: ${chain.join(" -> ")})`);
    }
    return void 0;
  }
  buildScopedTranslationObject(language) {
    const langObject = this.resources[language];
    if (!this.scope) {
      return langObject;
    }
    const cacheKey = this.buildLanguageScopeCacheKey(language);
    if (this.config.useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    if (typeof this.scope === "string") {
      const result = this.scope.split(".").reduce((acc, k) => acc?.[k], langObject);
      if (this.config.useCache) {
        if (this.cache.size >= MAX_SCOPE_CACHE) {
          const keysToDelete = Array.from(this.cache.keys()).slice(0, 100);
          for (const k of keysToDelete) {
            this.cache.delete(k);
          }
        }
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
        if (this.cache.size >= MAX_SCOPE_CACHE) {
          const keysToDelete = Array.from(this.cache.keys()).slice(0, 100);
          for (const k of keysToDelete) {
            this.cache.delete(k);
          }
        }
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
  findNestedValue(keys, tree) {
    if (keys.length === 0) {
      return tree;
    }
    if (!tree || typeof tree !== "object") {
      return void 0;
    }
    const fullKey = keys.join(".");
    if (Object.prototype.hasOwnProperty.call(tree, fullKey)) {
      return tree[fullKey];
    }
    for (let i = keys.length - 1; i >= 1; i--) {
      const prefix = keys.slice(0, i).join(".");
      if (Object.prototype.hasOwnProperty.call(tree, prefix)) {
        const remaining = keys.slice(i);
        const res = this.findNestedValue(remaining, tree[prefix]);
        if (res !== void 0) {
          return res;
        }
      }
    }
    const first = keys[0];
    if (Object.prototype.hasOwnProperty.call(tree, first)) {
      return this.findNestedValue(keys.slice(1), tree[first]);
    }
    if (!this.isUnsafeObjectKey(first) && first in tree && tree[first] !== void 0) {
      return this.findNestedValue(keys.slice(1), tree[first]);
    }
    return void 0;
  }
  getPluralRules(lang, type = "cardinal") {
    const cacheKey = `${lang}::${type}`;
    let rules = this.pluralRulesCache.get(cacheKey);
    if (!rules) {
      rules = new Intl.PluralRules(lang, { type });
      this.pluralRulesCache.set(cacheKey, rules);
    }
    return rules;
  }
  getDateTimeFormat(lang) {
    let fmt = this.dateTimeFormatCache.get(lang);
    if (!fmt) {
      fmt = new Intl.DateTimeFormat(lang);
      this.dateTimeFormatCache.set(lang, fmt);
    }
    return fmt;
  }
  getNumberFormat(lang) {
    let fmt = this.numberFormatCache.get(lang);
    if (!fmt) {
      fmt = new Intl.NumberFormat(lang);
      this.numberFormatCache.set(lang, fmt);
    }
    return fmt;
  }
  applyNamedFormatter(value, formatter, args) {
    const formatterFn = this.formatters?.[formatter];
    if (!formatterFn) {
      this.config.devMode && console.warn(`[LocL] Formatter "${formatter.toString()}" not found.`);
      return value;
    }
    return formatterFn(value, args);
  }
  applyPseudoAccents(text) {
    const tokenRegex = /(<\/?[a-zA-Z0-9_-]+(?:\s[^>]*)?>|{{[^{}]+}}|{[^{}]+})/g;
    const parts = text.split(tokenRegex);
    return parts.map((part) => {
      if (part.startsWith("<") || part.startsWith("{")) {
        return part;
      }
      return part.split("").map((ch) => PSEUDO_ACCENT_MAP[ch] ?? ch).join("");
    }).join("");
  }
  syncBrowserDocumentAttributes() {
    if (this.config.autoSyncDocument === false) {
      return;
    }
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("dir", this.getDirection());
      document.documentElement.setAttribute("lang", this.language);
    }
  }
  notifySubscribers() {
    const meta = this.getMetadata();
    for (const sub of this.subscribers) {
      try {
        sub(this.language, this.language, meta);
      } catch (err) {
        console.error("[LocL] Error in subscriber:", err);
      }
    }
  }
  async resolveRawBundle(raw, namespace) {
    let data = raw;
    if (typeof Response !== "undefined" && data instanceof Response) {
      if (!data.ok) {
        throw new Error(`[LocL] Failed to load resource: ${data.status} ${data.statusText}`);
      }
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
  isUnsafeObjectKey(key) {
    return key === "__proto__" || key === "constructor" || key === "prototype" || key === "__defineGetter__" || key === "__defineSetter__" || key === "__lookupGetter__" || key === "__lookupSetter__";
  }
};

// src/index.ts
function initLocL(config) {
  return new LocL(config);
}
function defineResources(resources) {
  return resources;
}
function defineStrictResources(resources) {
  return resources;
}
function defineFastResources(resources) {
  return resources;
}
function flattenDictionary(obj, prefix = "") {
  const result = {};
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return result;
  }
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const keys = Object.keys(val);
      const isPlural = keys.length > 0 && keys.every(
        (k) => ["zero", "one", "two", "few", "many", "other"].includes(k) || k.startsWith("=") || k === "ordinal"
      );
      if (isPlural) {
        result[fullKey] = val;
      } else {
        Object.assign(result, flattenDictionary(val, fullKey));
      }
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}
function unflattenDictionary(flat) {
  const result = {};
  if (!flat || typeof flat !== "object" || Array.isArray(flat)) {
    return result;
  }
  for (const [keyPath, val] of Object.entries(flat)) {
    const parts = keyPath.split(".");
    let cur = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (p === "__proto__" || p === "constructor" || p === "prototype") {
        break;
      }
      if (!cur[p] || typeof cur[p] !== "object" || Array.isArray(cur[p])) {
        cur[p] = {};
      }
      cur = cur[p];
    }
    const last = parts[parts.length - 1];
    if (last !== "__proto__" && last !== "constructor" && last !== "prototype") {
      cur[last] = val;
    }
  }
  return result;
}
export {
  LocL,
  defineFastResources,
  defineResources,
  defineStrictResources,
  flattenDictionary,
  initLocL,
  unflattenDictionary
};
