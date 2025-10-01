/**
 * The type of the default formatters object.
 */
type DefaultFormatters = typeof defaultFormatters;
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
declare const defaultFormatters: {
    /**
     * Converts a string to uppercase.
     * @param val - The value to format.
     * @returns The uppercased string.
     */
    upper: (val: any) => string;
    /**
     * Converts a string to lowercase.
     * @param val - The value to format.
     * @returns The lowercased string.
     */
    lower: (val: any) => string;
    /**
     * Capitalizes the first letter of a string.
     * @param val - The value to format.
     * @returns The capitalized string.
     */
    capitalize: (val: any) => string;
    /**
     * Trims whitespace from the beginning and end of a string.
     * @param val - The value to format.
     * @returns The trimmed string.
     */
    trim: (val: any) => string;
    /**
     * Truncates a string to a specified length.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {number} [args[0]=10] - The maximum length of the string.
     * @param {string} [args[1]="..."] - The suffix to append if the string is truncated.
     * @returns The truncated string.
     */
    truncate: (val: any, args: string[]) => string;
    /**
     * Formats a number using `Intl.NumberFormat`.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {string} [args[0]] - The locale to use.
     * @param {string} [args[1]] - The style of formatting to use (e.g., "decimal", "percent").
     * @returns The formatted number.
     */
    number: (val: any, args: string[]) => string;
    /**
     * Formats a number as a currency string using `Intl.NumberFormat`.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {string} [args[0]="USD"] - The currency code.
     * @param {string} [args[1]] - The locale to use.
     * @returns The formatted currency string.
     */
    currency: (val: any, args: string[]) => string;
    /**
     * Formats a date using `Intl.DateTimeFormat`.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {string} [args[0]] - The locale to use.
     * @param {string} [args[1]] - The date style to use (e.g., "short", "long").
     * @returns The formatted date string.
     */
    date: (val: any, args: string[]) => string;
    /**
     * Formats a date as a relative time string (e.g., "2 hours ago").
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {string} [args[0]] - The locale to use.
     * @returns The relative time string.
     */
    relativeDate: (val: any, args: string[]) => string;
    /**
     * Converts a value to a JSON string.
     * @param val - The value to format.
     * @returns The JSON string.
     */
    json: (val: any) => string;
    /**
     * Converts a boolean value to a "Yes" or "No" string.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {string} [args[0]="Yes"] - The string to return for a truthy value.
     * @param {string} [args[1]="No"] - The string to return for a falsy value.
     * @returns "Yes" or "No".
     */
    yesNo: (val: any, args?: [string, string]) => string;
    /**
     * Converts a boolean value to a "true" or "false" string.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {string} [args[0]="true"] - The string to return for a truthy value.
     * @param {string} [args[1]="false"] - The string to return for a falsy value.
     * @returns "true" or "false".
     */
    boolean: (val: any, args?: [string, string]) => string;
    /**
     * Pads the start of a string with another string.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {number} [args[0]=0] - The target length of the string.
     * @param {string} [args[1]=" "] - The string to pad with.
     * @returns The padded string.
     */
    padStart: (val: any, args: string[]) => string;
    /**
     * Pads the end of a string with another string.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {number} [args[0]=0] - The target length of the string.
     * @param {string} [args[1]=" "] - The string to pad with.
     * @returns The padded string.
     */
    padEnd: (val: any, args: string[]) => string;
};

type NestedKeyOf<ObjectType extends object> = {
    [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends any[] ? `${Key}` : ObjectType[Key] extends object ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}` : `${Key}`;
}[keyof ObjectType & (string | number)];
type NestedKeyOfObj<ObjectType extends object, SkipArrays extends boolean = false> = {
    [Key in keyof ObjectType & string]: ObjectType[Key] extends Array<any> ? SkipArrays extends true ? never : `${Key}` | `${Key}.${number}` : ObjectType[Key] extends object ? `${Key}` | `${Key}.${NestedKeyOfObj<ObjectType[Key], SkipArrays>}` : never;
}[keyof ObjectType & string];
type PathValue<T, P extends string> = P extends `${infer Key}.${infer Rest}` ? Key extends keyof T ? PathValue<T[Key], Rest> : Key extends `${infer N extends number}` ? N extends keyof T ? PathValue<T[N], Rest> : never : never : P extends keyof T ? T[P] : P extends `${infer N extends number}` ? N extends keyof T ? T[N] : never : never;
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
type DeepPick<T, P extends string> = P extends `${infer K}.${infer Rest}` ? K extends keyof T ? {
    [Key in K]: DeepPick<T[K], Rest>;
} : never : P extends keyof T ? {
    [Key in P]: T[P];
} : never;
type Language<T extends Record<string, any>> = keyof T & string;
type Scope<T extends Record<string, any>, Fallback extends keyof T> = NestedKeyOfObj<T[Fallback], true>;
type ScopeType<T extends Record<string, any>, F extends keyof T> = Scope<T, F> | Scope<T, F>[] | undefined;
type EnsureObject<T> = T extends object ? T : {};
type TranslationObjectFor<S extends Scope<T, Fallback> | Scope<T, Fallback>[] | undefined, T extends Record<string, any>, Fallback extends keyof T> = S extends undefined ? EnsureObject<T[Fallback]> : S extends Scope<T, Fallback> ? EnsureObject<PathValue<T[Fallback], S>> : S extends Scope<T, Fallback>[] ? EnsureObject<UnionToIntersection<DeepPick<T[Fallback], S[number]>>> : never;
type Translations<S extends ScopeType<T, F>, T extends Record<string, any>, F extends keyof T & string> = TranslationObjectFor<S, T, F>;
type PluralForms = "zero" | "one" | "two" | "few" | "many" | "other";
type PluralKeys<S extends ScopeType<T, F>, T extends Record<string, any>, F extends keyof T & string> = ExtractPluralKeys<Translations<S, T, F>>;
type ExtractPluralKeys<T, Path extends string = "", Depth extends any[] = []> = Depth['length'] extends 32 ? never : T extends object ? {
    [K in keyof T & string]: T[K] extends Partial<Record<PluralForms, string>> ? Path extends "" ? K : `${Path}.${K}` : K extends `${infer Base}_one` ? `${Base}_other` extends keyof T ? Path extends "" ? Base : `${Path}.${Base}` : never : T[K] extends object ? ExtractPluralKeys<T[K], Path extends "" ? K : `${Path}.${K}`, [...Depth, 1]> : never;
}[keyof T & string] : never;
interface InterpolationOptions {
    [key: string]: string | number | Date | undefined;
    count?: number;
}
interface PluralInterpolationOptions extends InterpolationOptions {
    count: number;
}
interface FormatOptions<F extends Record<string, Formatter>, UseDefaultFormatter extends boolean> {
    formatter: keyof EffectiveFormatters<F, UseDefaultFormatter>;
    args?: string[];
}
type Formatter<TArgs extends unknown[] = string[]> = (value: any, args?: TArgs) => string;

type EffectiveFormatters<F extends Record<string, Formatter>, UseDefault extends boolean> = UseDefault extends true ? F & DefaultFormatters : F;
type RequiredPlural = "one" | "other";
type OptionalPlural = Exclude<PluralForms, RequiredPlural>;
type ObjectPlural = {
    [K in RequiredPlural]: string;
} & Partial<Record<OptionalPlural, string>>;
type Primitive = string | number | boolean | null | undefined;
type StrKey<T> = Extract<keyof T, string>;
type PluralObjectKeys<T> = {
    [K in StrKey<T>]: T[K] extends object ? Extract<keyof T[K], PluralForms> extends never ? never : K : never;
}[StrKey<T>];
type SuffixKey<T> = Extract<StrKey<T>, `${string}_${PluralForms}`>;
type SuffixBaseUnion<T> = SuffixKey<T> extends `${infer B}_${PluralForms}` ? B : never;
type NamespaceKeys<T> = {
    [K in StrKey<T>]: T[K] extends object ? Extract<keyof T[K], PluralForms> extends never ? K : never : never;
}[StrKey<T>];
type PlainStringKeys<T> = {
    [K in StrKey<T>]: K extends SuffixKey<T> ? never : T[K] extends string ? K : never;
}[StrKey<T>];
type LangWithPlurals<T> = T extends Primitive ? T : T extends (infer U)[] ? LangWithPlurals<U>[] : {
    [K in NamespaceKeys<T>]: LangWithPlurals<T[K]>;
} & {
    [K in PluralObjectKeys<T>]: ObjectPlural;
} & {
    [B in SuffixBaseUnion<T> as `${B}_${RequiredPlural}`]: string;
} & {
    [B in SuffixBaseUnion<T> as `${B}_${OptionalPlural}`]?: string;
} & {
    [K in PlainStringKeys<T>]: string;
} & {
    [K in Exclude<StrKey<T>, NamespaceKeys<T> | PluralObjectKeys<T> | PlainStringKeys<T> | SuffixKey<T>>]: T[K];
};

/**
 * Configuration for the LocL instance.
 * @template T - The type of the resources object.
 * @template Fallback - The fallback language.
 * @template F - The type of the custom formatters.
 */
interface LocLConfig<T extends Record<string, any>, Fallback extends keyof T & string, F extends Record<string, Formatter> = {}> {
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
declare class LocL<T extends Record<string, any>, Fallback extends keyof T & string, S extends ScopeType<T, Fallback> = undefined, F extends Record<string, Formatter> = {}, UseDefaultFormatter extends boolean = true> {
    private config;
    private language;
    private fallbackLanguage;
    private scope?;
    private pluralRules;
    private formatters;
    private cache;
    private proxyCache;
    /**
     * Creates a new LocL instance.
     * @param config - The configuration object.
     */
    constructor(config: LocLConfig<T, Fallback> & {
        fallbackLanguage: Fallback;
        formatters?: F;
        useDefaultFormatters?: UseDefaultFormatter;
        scope?: S;
    });
    /**
     * Creates a new proxy translator instance with a different configuration.
     * This is a lightweight way to create a translator with a different scope or language
     * without creating a completely new instance.
     * @param config - The configuration object.
     * @param {N} [config.scope] - The scope to load translations from.
     * @param {Language<T>} [config.language] - The language to use.
     * @returns A new proxy `LocL` instance.
     */
    withConfig<N extends ScopeType<T, Fallback>>(config: {
        scope?: N;
        language?: Language<T>;
    }): LocL<T, Fallback, N>;
    /**
     * Creates a new `LocL` instance with a different language or scope.
     * @param language - The language to use for the new instance. Defaults to the current language.
     * @param scope - The scope to use for the new instance.
     * @returns A new `LocL` instance.
     */
    clone<N extends ScopeType<T, Fallback> = undefined>(language?: Language<T>, scope?: N): LocL<T, Fallback, N>;
    /**
     * Changes the current language of the translator.
     * @param lang - The new language to set.
     */
    changeLanguage(lang: Language<T>): void;
    /**
     * Translates a key.
     * If no key is provided, it returns the entire translation object for the current scope.
     * @param key - The key to translate.
     * @param values - An object with values to interpolate into the translation.
     * @param format - An object with formatting options.
     * @returns The translated and formatted string, or the translation object.
     */
    t(): TranslationObjectFor<S, T, Fallback>;
    t<K extends NestedKeyOf<TranslationObjectFor<S, T, Fallback>>>(key: K, values?: InterpolationOptions, format?: FormatOptions<F, UseDefaultFormatter>): PathValue<TranslationObjectFor<S, T, Fallback>, K>;
    /**
     * Translates a key without strict type checking.
     * This is useful for compatibility with other i18n libraries or dynamic keys.
     * @param key - The key to translate.
     * @param values - An object with values to interpolate into the translation.
     * @param format - An object with formatting options.
     * @returns The translated and formatted string.
     */
    tt(key?: any, values?: InterpolationOptions, format?: FormatOptions<F, UseDefaultFormatter>): any;
    /**
     * Formats a value using a specific formatter.
     * @param value - The value to format.
     * @param formatter - The name of the formatter to use.
     * @param args - An array of arguments to pass to the formatter.
     * @returns The formatted string.
     */
    format(value: string, formatter: keyof EffectiveFormatters<F, UseDefaultFormatter>, args?: string[]): string;
    /**
     * Translates a key with pluralization.
     * It automatically selects the correct plural form based on the `count` value.
     * @param key - The base key for the pluralization.
     * @param values - An object with a `count` property and other values to interpolate.
     * @param format - An object with formatting options.
     * @returns The translated, pluralized, and formatted string.
     */
    plural<K extends PluralKeys<S, T, Fallback>>(key: K, values: PluralInterpolationOptions, format?: FormatOptions<F, UseDefaultFormatter>): string;
    /**
     * Gets a translation object or a specific translation value.
     * If no key is provided, it returns the entire translation object for the current language and scope.
     * @param key - The key of the translation to get.
     * @returns The translation object or value, or `undefined` if not found.
     */
    get(): TranslationObjectFor<S, T, Fallback>;
    get<K extends NestedKeyOf<TranslationObjectFor<S, T, Fallback>>>(key: K): PathValue<TranslationObjectFor<S, T, Fallback>, K> | undefined;
    /**
     * Gets a nested object from the translations.
     * This is a type-safe way to get a nested object.
     * @param key - The key of the object to get.
     * @returns The nested translation object, or `undefined` if not found.
     */
    getObj<K extends NestedKeyOfObj<TranslationObjectFor<S, T, Fallback>, false>>(key: K): PathValue<TranslationObjectFor<S, T, Fallback>, K> | undefined;
    private isLanguage;
    private getCacheKey;
    private lookupWithFallback;
    private buildTranslationObject;
    private findTranslation;
    private checkPlural;
    private interpolate;
    private applyFormat;
    private makeReadOnly;
}

/**
 * Initializes a new LocL instance.
 *
 * @example
 * ```ts
 * const translator = initLocL({
 *   resources: {
 *     en: { greeting: "Hello, {name}!" },
 *     de: { greeting: "Hallo, {name}!" }
 *   },
 *   fallbackLanguage: "en"
 * });
 *
 * const greeting = translator.t("greeting", { name: "World" });
 * ```
 *
 * @template T - The type of the resources object, mapping language codes to translation objects.
 * @template Fallback - The fallback language, which must be a key in the resources object.
 * @template S - The specific scope or scopes to load from the translations.
 * @template F - The type for custom formatters.
 * @template UseDefaultFormatter - A boolean indicating whether to include default formatters.
 *
 * @param config - The configuration object for the translator.
 * @param {T} config.resources - An object containing all language translations.
 * @param {Fallback} config.fallbackLanguage - The default language to use if a translation is missing.
 * @param {(keyof T & string)} [config.language] - The initial language to use.
 * @param {S} [config.scope] - Narrows the translation object to a specific scope (e.g., "common").
 * @param {F} [config.formatters] - A map of custom formatting functions.
 * @param {boolean} [config.useDefaultFormatters=true] - Whether to include the built-in formatters.
 * @param {boolean} [config.devMode=false] - Enables warnings for missing keys and scopes.
 * @param {boolean} [config.useCache=true] - Enables caching of scopes and proxies.
 *
 * @returns A new `LocL` instance configured with the provided options.
 */
declare function initLocL<T extends Record<string, any>, Fallback extends keyof T & string, S extends ScopeType<T, Fallback> = undefined, F extends Record<string, Formatter> = {}, UseDefaultFormatter extends boolean = true>(config: LocLConfig<T, Fallback> & {
    scope?: S;
    formatters?: F;
    useDefaultFormatters?: UseDefaultFormatter;
}): LocL<T, Fallback, S, F, UseDefaultFormatter>;

export { type LangWithPlurals, initLocL };
