/**
 * The type of the default formatters object.
 */
export type DefaultFormatters = typeof defaultFormatters;

const listFormatCache = new Map<string, Intl.ListFormat>();
const displayNamesCache = new Map<string, Intl.DisplayNames>();


/**
 * A collection of default formatting functions that can be used in translations.
 * @example
 * ```ts
 * const translator = initLangPack({
 *   resources: {
 *     en: { greeting: "Hello, {name | upper}!" }
 *   },
 *   fallbackLanguage: "en"
 * });
 *
 * translator.t("greeting", { name: "world" }); // "Hello, WORLD!"
 * ```
 */
export const defaultFormatters = {
  /**
   * Converts a string to uppercase.
   * @param val - The value to format.
   * @returns The uppercased string.
   */
  upper: (val: any) => String(val).toUpperCase(),

  /**
   * Converts a string to lowercase.
   * @param val - The value to format.
   * @returns The lowercased string.
   */
  lower: (val: any) => String(val).toLowerCase(),

  /**
   * Capitalizes the first letter of a string.
   * @param val - The value to format.
   * @returns The capitalized string.
   */
  capitalize: (val: any) => String(val).charAt(0).toUpperCase() + String(val).slice(1),

  /**
   * Trims whitespace from the beginning and end of a string.
   * @param val - The value to format.
   * @returns The trimmed string.
   */
  trim: (val: any) => String(val).trim(),

  /**
   * Truncates a string to a specified length.
   * @param val - The value to format.
   * @param args - An array of arguments.
   * @param {number} [args[0]=10] - The maximum length of the string.
   * @param {string} [args[1]="..."] - The suffix to append if the string is truncated.
   * @returns The truncated string.
   */
  truncate: (val: any, args: string[] = []) => {
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
  number: (val: any, args: string[] = []) => {
    const locales = args[0] || undefined;
    const options: Intl.NumberFormatOptions = {};
    if (args[1]) options.style = args[1] as Intl.NumberFormatOptions["style"];
    const num = Number(val);
    if (isNaN(num)) { return String(val); }
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
  currency: (val: any, args: string[] = []) => {
    const currency = args[0] || "USD";
    const locales = args[1] || undefined;
    const num = Number(val);
    if (isNaN(num)) { return String(val); }
    return new Intl.NumberFormat(locales, {
      style: "currency",
      currency,
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
  date: (val: any, args: string[] = []) => {
    const locales = args[0] || undefined;
    const options: Intl.DateTimeFormatOptions = {};
    if (args[1]) options.dateStyle = args[1] as Intl.DateTimeFormatOptions["dateStyle"];
    const d = new Date(val);
    if (isNaN(d.getTime())) { return String(val); }
    return new Intl.DateTimeFormat(locales, options).format(d);
  },

  /**
   * Formats a date as a relative time string (e.g., "2 hours ago").
   * @param val - The value to format.
   * @param args - An array of arguments.
   * @param {string} [args[0]] - The locale to use.
   * @returns The relative time string.
   */
  relativeDate: (val: any, args: string[] = []) => {
    const locales = args[0] || undefined;
    const options: Intl.RelativeTimeFormatOptions = { numeric: "auto" };
    const rtf = new Intl.RelativeTimeFormat(locales, options);
    const time = new Date(val).getTime();
    if (isNaN(time)) { return String(val); }
    const diff = (time - Date.now()) / 1000;
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
  json: (val: any) => JSON.stringify(val, null, 2),

  /**
   * Converts a boolean value to a "Yes" or "No" string.
   * @param val - The value to format.
   * @param args - An array of arguments.
   * @param {string} [args[0]="Yes"] - The string to return for a truthy value.
   * @param {string} [args[1]="No"] - The string to return for a falsy value.
   * @returns "Yes" or "No".
   */
  yesNo: (val: any, args: string[] = []) => {
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
  boolean: (val: any, args: string[] = []) => {
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
  padStart: (val: any, args: string[] = []) => {
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
  padEnd: (val: any, args: string[] = []) => {
    const length = parseInt(args[0]) || 0;
    const fill = args[1] || " ";
    return String(val).padEnd(length, fill);
  },

  /**
   * Formats a list of items using native `Intl.ListFormat`.
   * @example
   * `{users | list}` -> "Alice, Bob, and Charlie"
   * `{users | list:de,disjunction}` -> "Alice, Bob oder Charlie"
   */
  list: (val: any, args: string[] = []) => {
    const locales = args[0] || undefined;
    const type = (args[1] as Intl.ListFormatType) || "conjunction";
    const style = (args[2] as Intl.ListFormatOptions["style"]) || "long";
    const items = Array.isArray(val) ? val.map((v) => String(v)) : [String(val)];
    const key = `${locales || "default"}::${type}::${style}`;
    let fmt = listFormatCache.get(key);
    if (!fmt) {
      fmt = new Intl.ListFormat(locales, { type, style });
      listFormatCache.set(key, fmt);
    }
    return fmt.format(items);
  },

  /**
   * Formats a language code into its localized display name using `Intl.DisplayNames`.
   * @example
   * `{lang | languageName:en}` -> "German"
   * `{lang | languageName:de}` -> "Deutsch"
   */
  languageName: (val: any, args: string[] = []) => {
    const locale = args[0] || undefined;
    const code = String(val);
    const key = `${locale || "default"}::language`;
    try {
      let dn = displayNamesCache.get(key);
      if (!dn) {
        dn = new Intl.DisplayNames(locale, { type: "language" });
        displayNamesCache.set(key, dn);
      }
      return dn.of(code) || code;
    } catch {
      return code;
    }
  },

  /**
   * Formats a region/country code into its localized display name using `Intl.DisplayNames`.
   * @example
   * `{country | regionName:en}` -> "United States"
   */
  regionName: (val: any, args: string[] = []) => {
    const locale = args[0] || undefined;
    const code = String(val);
    const key = `${locale || "default"}::region`;
    try {
      let dn = displayNamesCache.get(key);
      if (!dn) {
        dn = new Intl.DisplayNames(locale, { type: "region" });
        displayNamesCache.set(key, dn);
      }
      return dn.of(code) || code;
    } catch {
      return code;
    }
  },

  /**
   * Formats a currency code into its localized display name using `Intl.DisplayNames`.
   * @example
   * `{curr | currencyName:en}` -> "US Dollar"
   */
  currencyName: (val: any, args: string[] = []) => {
    const locale = args[0] || undefined;
    const code = String(val);
    const key = `${locale || "default"}::currency`;
    try {
      let dn = displayNamesCache.get(key);
      if (!dn) {
        dn = new Intl.DisplayNames(locale, { type: "currency" });
        displayNamesCache.set(key, dn);
      }
      return dn.of(code) || code;
    } catch {
      return code;
    }
  },

  /**
   * Generalized display name resolver using `Intl.DisplayNames`.
   * @example
   * `{code | displayName:language,en}`
   */
  displayName: (val: any, args: string[] = []) => {
    const type = (args[0] as Intl.DisplayNamesOptions["type"]) || "language";
    const locale = args[1] || undefined;
    const code = String(val);
    const key = `${locale || "default"}::${type}`;
    try {
      let dn = displayNamesCache.get(key);
      if (!dn) {
        dn = new Intl.DisplayNames(locale, { type });
        displayNamesCache.set(key, dn);
      }
      return dn.of(code) || code;
    } catch {
      return code;
    }
  }
};