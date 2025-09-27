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
var index_exports = {};
__export(index_exports, {
  initLocL: () => initLocL
});
module.exports = __toCommonJS(index_exports);

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
  truncate: (val, args) => {
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
  number: (val, args) => {
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
  currency: (val, args) => {
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
  date: (val, args) => {
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
  relativeDate: (val, args) => {
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
  yesNo: (val, args) => {
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
  boolean: (val, args) => {
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
  padStart: (val, args) => {
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
  padEnd: (val, args) => {
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
    this.cache = /* @__PURE__ */ new Map();
    this.proxyCache = /* @__PURE__ */ new WeakMap();
    if (!config.resources) {
      throw new Error("[LocL] `resources` is required");
    }
    if (!config.fallbackLanguage) {
      throw new Error("[LocL] `fallbackLanguage` is required");
    }
    config = {
      useDefaultFormatters: true,
      devMode: false,
      useCache: true,
      ...config
    };
    config.resources = this.makeReadOnly(config.resources);
    this.config = config;
    this.language = this.isLanguage(config.language) ?? config.fallbackLanguage;
    this.fallbackLanguage = config.fallbackLanguage;
    this.scope = config.scope;
    this.pluralRules = new Intl.PluralRules(this.language);
    this.formatters = config.useDefaultFormatters ? { ...defaultFormatters, ...config.formatters ?? {} } : { ...config.formatters ?? {} };
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
    const cacheKey = `proxy::${config.language ?? this.language}::${Array.isArray(config.scope) ? config.scope.join("|") : config.scope ?? "*"}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    return new Proxy(this, {
      get(target, prop) {
        if (prop === "language") {
          return config.language ?? target.language;
        }
        if (prop === "scope") {
          return config.scope;
        }
        return target[prop];
      }
    });
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
      language,
      scope
    });
  }
  /**
   * Changes the current language of the translator.
   * @param lang - The new language to set.
   */
  changeLanguage(lang) {
    if (Object.keys(this.config.resources).includes(lang)) {
      this.language = lang;
      this.pluralRules = new Intl.PluralRules(this.language);
    }
  }
  t(key, values, format) {
    if (!key) {
      return this.get();
    }
    const pluralCheckResult = this.checkPlural(key, values);
    if (pluralCheckResult !== void 0) {
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
  /**
   * Translates a key with pluralization.
   * It automatically selects the correct plural form based on the `count` value.
   * @param key - The base key for the pluralization.
   * @param values - An object with a `count` property and other values to interpolate.
   * @param format - An object with formatting options.
   * @returns The translated, pluralized, and formatted string.
   */
  plural(key, values, format) {
    const category = this.pluralRules.select(values.count);
    const baseKey = key;
    const baseValue = this.lookupWithFallback(baseKey);
    let interpolated;
    if (baseValue && typeof baseValue === "object") {
      if (category in baseValue) {
        interpolated = this.interpolate(baseValue[category], values) ?? baseKey;
      } else if ("other" in baseValue) {
        this.config.devMode && console.warn(`[LocL] Missing plural: "${baseKey}" in "${this.language}"`);
        interpolated = this.interpolate(baseValue.other, values) ?? baseKey;
      } else {
        this.config.devMode && console.warn(`[LocL] Missing plural: "${baseKey}" in "${this.language}"`);
        interpolated = baseKey;
      }
    } else {
      const pluralKey = `${baseKey}_${category}`;
      const result = this.lookupWithFallback(pluralKey) ?? this.lookupWithFallback(`${baseKey}_other`) ?? this.lookupWithFallback(baseKey);
      interpolated = this.interpolate(result, values) ?? baseKey;
    }
    if (format && format.formatter) {
      return this.applyFormat(interpolated, format.formatter, format.args);
    }
    return interpolated;
  }
  get(key) {
    const base = this.buildTranslationObject(this.language);
    if (!key) {
      return base;
    }
    return this.lookupWithFallback(key, base);
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
    const language = value.substring(0, 2);
    return Object.keys(this.config.resources).includes(language) ? language : null;
  }
  getCacheKey(language) {
    const scopeKey = Array.isArray(this.scope) ? this.scope.join("|") : this.scope ?? "*";
    return `${language ?? this.language}::${scopeKey}`;
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
    const langObject = this.config.resources[language];
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
      const roCombined = this.makeReadOnly(combined);
      if (this.config.useCache) {
        this.cache.set(cacheKey, roCombined);
      }
      return roCombined;
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
      if (current.hasOwnProperty(keyTest)) {
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
  checkPlural(key, values) {
    if (values?.count !== void 0 && !key.match(/_(one|few|many|other)$/)) {
      const category = this.pluralRules.select(values.count);
      const pluralKey = `${key}_${category}`;
      const pluralResult = this.lookupWithFallback(pluralKey);
      return this.interpolate(pluralResult, values);
    }
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
          tokens.push({ raw, inner: raw.slice(1, -1).trim() });
          start = -1;
        }
      }
    }
    let output = result;
    for (const token of tokens) {
      let replacement = "";
      if (token.inner.includes("select")) {
        const [field, type, ...rest] = token.inner.split(",").map((x) => x.trim());
        if (type === "select") {
          const value = String(values[field] ?? "other");
          const caseRegex = /(\w+)\s*\{([^}]*)\}/g;
          const caseMap = {};
          let match;
          while ((match = caseRegex.exec(rest.join(" "))) !== null) {
            const [, key, text] = match;
            caseMap[key] = text.trim();
          }
          replacement = caseMap[value] ?? caseMap.other ?? "";
        }
      } else {
        const [fieldName, formatterAndArgs] = token.inner.split("|").map((x) => x.trim());
        const [formatterName, argsStr] = formatterAndArgs ? formatterAndArgs.split(":") : [];
        const args = argsStr ? argsStr.split(",") : [];
        const val = values[fieldName];
        if (formatterName && this.formatters?.[formatterName]) {
          replacement = this.formatters[formatterName](val, args);
        } else if (val instanceof Date) {
          replacement = new Intl.DateTimeFormat(this.language).format(val);
        } else if (typeof val === "number") {
          replacement = new Intl.NumberFormat(this.language).format(val);
        } else {
          replacement = val !== void 0 ? String(val) : token.raw;
        }
      }
      output = output.replace(token.raw, replacement);
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
};

// src/index.ts
function initLocL(config) {
  return new LocL(config);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  initLocL
});
