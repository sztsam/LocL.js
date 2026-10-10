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
    truncate: (val: any, args?: string[]) => string;
    /**
     * Formats a number using `Intl.NumberFormat`.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {string} [args[0]] - The locale to use.
     * @param {string} [args[1]] - The style of formatting to use (e.g., "decimal", "percent").
     * @returns The formatted number.
     */
    number: (val: any, args?: string[]) => string;
    /**
     * Formats a number as a currency string using `Intl.NumberFormat`.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {string} [args[0]="USD"] - The currency code.
     * @param {string} [args[1]] - The locale to use.
     * @returns The formatted currency string.
     */
    currency: (val: any, args?: string[]) => string;
    /**
     * Formats a date using `Intl.DateTimeFormat`.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {string} [args[0]] - The locale to use.
     * @param {string} [args[1]] - The date style to use (e.g., "short", "long").
     * @returns The formatted date string.
     */
    date: (val: any, args?: string[]) => string;
    /**
     * Formats a date as a relative time string (e.g., "2 hours ago").
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {string} [args[0]] - The locale to use.
     * @returns The relative time string.
     */
    relativeDate: (val: any, args?: string[]) => string;
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
    yesNo: (val: any, args?: string[]) => string;
    /**
     * Converts a boolean value to a "true" or "false" string.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {string} [args[0]="true"] - The string to return for a truthy value.
     * @param {string} [args[1]="false"] - The string to return for a falsy value.
     * @returns "true" or "false".
     */
    boolean: (val: any, args?: string[]) => string;
    /**
     * Pads the start of a string with another string.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {number} [args[0]=0] - The target length of the string.
     * @param {string} [args[1]=" "] - The string to pad with.
     * @returns The padded string.
     */
    padStart: (val: any, args?: string[]) => string;
    /**
     * Pads the end of a string with another string.
     * @param val - The value to format.
     * @param args - An array of arguments.
     * @param {number} [args[0]=0] - The target length of the string.
     * @param {string} [args[1]=" "] - The string to pad with.
     * @returns The padded string.
     */
    padEnd: (val: any, args?: string[]) => string;
};

type NestedKeyOf<ObjectType extends object, Depth extends number = 8, UsedDepth extends any[] = []> = UsedDepth['length'] extends Depth ? never : {
    [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends any[] ? `${Key}` : ObjectType[Key] extends object ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key], Depth, [...UsedDepth, any]>}` : `${Key}`;
}[keyof ObjectType & (string | number)];
type NestedKeyOfObj<ObjectType extends object, SkipArrays extends boolean = false, Depth extends number = 8, UsedDepth extends any[] = []> = UsedDepth['length'] extends Depth ? never : {
    [Key in keyof ObjectType & string]: ObjectType[Key] extends Array<any> ? SkipArrays extends true ? never : `${Key}` | `${Key}.${number}` : ObjectType[Key] extends object ? `${Key}` | `${Key}.${NestedKeyOfObj<ObjectType[Key], SkipArrays, Depth, [...UsedDepth, any]>}` : never;
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
type TranslationObjectFor<S extends Scope<T, Fallback> | Scope<T, Fallback>[] | undefined, T extends Record<string, any>, Fallback extends keyof T> = [
    S
] extends [undefined] ? EnsureObject<T[Fallback]> : [S] extends [Scope<T, Fallback>] ? EnsureObject<PathValue<T[Fallback], S>> : [S] extends [Scope<T, Fallback>[]] ? EnsureObject<UnionToIntersection<DeepPick<T[Fallback], S[number]>>> : EnsureObject<T[Fallback]>;
type Translations<S extends ScopeType<T, F>, T extends Record<string, any>, F extends keyof T & string> = TranslationObjectFor<S, T, F>;
type Trim<T extends string> = T extends ` ${infer Rest}` ? Trim<Rest> : T extends `${infer Rest} ` ? Trim<Rest> : T;
type ExtractVarName<T extends string> = T extends `${infer Var}|${string}` ? Trim<Var> : T extends `${infer Var},${string}` ? Trim<Var> : Trim<T>;
type InterpolationValue = string | number | boolean | Date;
type Whitespace = " " | "\n" | "\t" | "\r";
type TrimStart<T extends string> = T extends `${Whitespace}${infer Rest}` ? TrimStart<Rest> : T;
type ReadBalanced<S extends string, Depth extends 1[] = [1], Acc extends string = ""> = S extends `${infer Before}}${infer After}` ? Before extends `${infer Head}{${infer Tail}` ? ReadBalanced<`${Tail}}${After}`, [...Depth, 1], `${Acc}${Head}{`> : Depth extends [1] ? [`${Acc}${Before}`, After] : Depth extends [1, ...infer Outer extends 1[]] ? ReadBalanced<After, Outer, `${Acc}${Before}}`> : null : null;
type Param<Name extends string, V> = Trim<Name> extends infer N extends string ? N extends "" ? {} : {
    [K in N]: V;
} : {};
type VariableParams<Raw extends string> = Param<ExtractVarName<Raw>, InterpolationValue>;
type TokenParams<Inner extends string> = Inner extends `{${infer Unwrapped}}` ? TokenBody<Unwrapped> : TokenBody<Inner>;
type TokenBody<Inner extends string> = Inner extends `${infer Field},${infer Rest}` ? TrimStart<Rest> extends `select${infer AfterKeyword}` ? TrimStart<AfterKeyword> extends `,${infer Cases}` ? Param<Field, string> & CaseParams<Cases> : VariableParams<Inner> : VariableParams<Inner> : VariableParams<Inner>;
type CaseParams<Cases extends string, Acc = {}> = Cases extends `${string}{${infer Rest}` ? ReadBalanced<Rest> extends [infer Body extends string, infer After extends string] ? CaseParams<After, Acc & ScanParams<Body>> : Acc : Acc;
type ScanParams<S extends string, Acc = {}> = S extends `${string}{${infer Rest}` ? ReadBalanced<Rest> extends [infer Inner extends string, infer After extends string] ? ScanParams<After, Acc & TokenParams<Inner>> : Acc : Acc;
type ExtractInterpolationParams<T extends string> = string extends T ? {
    [key: string]: string | number | boolean | Date | undefined;
} : ScanParams<T>;
type Simplify<T> = {
    [K in keyof T]: T[K];
};
type PluralForms = "zero" | "one" | "two" | "few" | "many" | "other";
type IsPluralObject<V> = [
    V
] extends [object] ? [keyof V] extends [never] ? false : [keyof V] extends [PluralForms] ? true : false : false;
type ExtractPluralObjectParams<T> = [
    T
] extends [never] ? never : T extends Partial<Record<PluralForms, string>> ? Simplify<{
    count: number;
} & UnionToIntersection<{
    [K in keyof T]: T[K] extends string ? ExtractInterpolationParams<T[K]> : {};
}[keyof T]>> : never;
type SuffixParam<T, P extends string> = [
    PathValue<T, P>
] extends [never] ? {} : PathValue<T, P> extends string ? ExtractInterpolationParams<PathValue<T, P>> : {};
type ExtractSuffixPluralParams<Base extends string, T> = Simplify<{
    count: number;
} & UnionToIntersection<{
    [P in PluralForms]: SuffixParam<T, `${Base}_${P}`>;
}[PluralForms]>>;
type PluralParamsFor<K extends string, T> = string extends K ? {
    count: number;
} & InterpolationOptions : string extends keyof T ? {
    count: number;
} & InterpolationOptions : [PathValue<T, K>] extends [never] ? ExtractSuffixPluralParams<K, T> : IsPluralObject<PathValue<T, K>> extends true ? ExtractPluralObjectParams<PathValue<T, K>> : ExtractSuffixPluralParams<K, T>;
type ParamsFor<Val> = string extends Val ? InterpolationOptions : Val extends string ? Simplify<ExtractInterpolationParams<Val>> : IsPluralObject<Val> extends true ? ExtractPluralObjectParams<Val> : {};
type IsEmptyParams<P> = [
    keyof P
] extends [never] ? true : string extends keyof P ? true : false;
type PluralKeys<S extends ScopeType<T, F>, T extends Record<string, any>, F extends keyof T & string> = string extends keyof Translations<S, T, F> ? string : ExtractPluralKeys<Translations<S, T, F>>;
type ExtractPluralKeys<T, Path extends string = "", Depth extends any[] = []> = Depth['length'] extends 16 ? never : T extends object ? {
    [K in keyof T & string]: (K extends `${infer Base}_${PluralForms}` ? Path extends "" ? Base : `${Path}.${Base}` : never) | (T[K] extends object ? IsPluralObject<T[K]> extends true ? Path extends "" ? K : `${Path}.${K}` : ExtractPluralKeys<T[K], Path extends "" ? K : `${Path}.${K}`, [...Depth, 1]> : never);
}[keyof T & string] : never;
interface InterpolationOptions {
    [key: string]: string | number | Date | boolean | undefined;
    count?: number;
}
interface FormatOptions<F extends Record<string, Formatter>, UseDefaultFormatter extends boolean> {
    formatter: keyof EffectiveFormatters<F, UseDefaultFormatter>;
    args?: string[];
}
type Formatter<TArgs extends unknown[] = string[]> = (value: any, args?: TArgs) => string;

type EffectiveFormatters<F extends Record<string, Formatter>, UseDefault extends boolean> = UseDefault extends true ? F & DefaultFormatters : F;
type Subscriber<T extends Record<string, any>> = (language: Language<T>, prevLanguage: Language<T>) => void;
type Unsubscribe = () => void;
type TagFormatter<T = any> = (content: string) => T;
type TagInterpolationOptions<T = any> = Record<string, TagFormatter<T> | string | number | Date | boolean | undefined>;
type TArgs<K extends string, Tr, PK extends string, F extends Record<string, Formatter>, U extends boolean> = unknown extends K ? [values?: InterpolationOptions, format?: FormatOptions<F, U>] : string extends PK ? [values?: InterpolationOptions, format?: FormatOptions<F, U>] : K extends PK ? [values: PluralParamsFor<K, Tr>, format?: FormatOptions<F, U>] : IsEmptyParams<ParamsFor<PathValue<Tr, K>>> extends true ? [values?: InterpolationOptions, format?: FormatOptions<F, U>] : [values: ParamsFor<PathValue<Tr, K>> & InterpolationOptions, format?: FormatOptions<F, U>];
type TResult<K extends string, Tr, PK extends string> = string extends PK ? PathValue<Tr, K> : K extends PK ? string : PathValue<Tr, K>;
type DeepMerge<T, U> = T extends object ? U extends object ? {
    [K in keyof T | keyof U]: K extends keyof U ? K extends keyof T ? DeepMerge<T[K], U[K]> : U[K] : K extends keyof T ? T[K] : never;
} : U : U;
type DeepMergeResources<T extends Record<string, any>, L extends string, B extends Record<string, any>> = L extends keyof T ? {
    [K in keyof T]: K extends L ? DeepMerge<T[K], B> : T[K];
} : T & {
    [K in L]: B;
};
type LoadableBundle = Record<string, any> | {
    default: Record<string, any> | (() => any);
} | (() => Record<string, any> | Promise<Record<string, any>>) | Response | string;
type ResourceLoader = (language: string, namespace?: string) => LoadableBundle | Promise<LoadableBundle>;
type RequiredPlural = "one" | "other";
type OptionalPlural = Exclude<PluralForms, RequiredPlural>;
type ObjectPlural = {
    [K in RequiredPlural]: string;
} & Partial<Record<OptionalPlural, string>>;
type Primitive = string | number | boolean | null | undefined;
type StrKey<T> = Extract<keyof T, string | number>;
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
    [K in PlainStringKeys<T>]: T[K];
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
declare class LocL<T extends Record<string, any>, Fallback extends keyof T & string, S extends ScopeType<T, Fallback> = undefined, F extends Record<string, Formatter> = {}, UseDefaultFormatter extends boolean = true> {
    private readonly rootInstance;
    private config;
    private resources;
    private language;
    private fallbackLanguage;
    private scope?;
    private formatters;
    private cache;
    private proxyCache;
    private pluralRulesCache;
    private subscribers;
    private loader?;
    private loadedNamespaces;
    private loadedLanguages;
    private loadingPromises;
    private version;
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
     * Subscribes a listener to language changes.
     * Conforms to the standard reactive store contract (e.g. Svelte stores).
     * Calls the listener immediately with the current language and returns an unsubscribe function.
     * @param listener - The subscriber callback function.
     * @returns An unsubscribe function.
     */
    subscribe(listener: Subscriber<T>): Unsubscribe;
    /**
     * Gets the current active language.
     */
    getLanguage(): Language<T>;
    getVersion(): number;
    /**
     * Checks if an entire language or specific namespace is loaded.
     */
    isLoaded(lang?: string, namespace?: string): boolean;
    /**
     * Resolves raw data from JSON, TS/JS modules, functions, or fetch Responses into a clean dictionary object.
     */
    private resolveBundle;
    /**
     * Loads a full language file (e.g. `de.json`) or a namespace (e.g. `de/dashboard.json`).
     * Supports both monolithic files and modular namespaces.
     */
    load(lang?: string, namespace?: string, loader?: ResourceLoader | undefined): Promise<void>;
    loadLanguage(lang: string, loader?: ResourceLoader): Promise<void>;
    loadNamespace(namespace: string, lang?: string, loader?: ResourceLoader): Promise<void>;
    /**
     * Adds or overrides a single translation key at runtime.
     * @param lang - Target language code.
     * @param key - Dotted path key.
     * @param value - The translation value.
     */
    addResource(lang: Language<T> | string, key: string, value: any): void;
    /**
     * Deeply merges a resource bundle into the specified language at runtime.
     * @param lang - Target language code.
     * @param bundle - Object of translations to merge.
     * @returns DeepMergedResource LocL type
     */
    addResources<const L extends Language<T> | string, const B extends Record<string, any>>(lang: L, bundle: B): LocL<DeepMergeResources<T, L, B>, Fallback, S, F, UseDefaultFormatter>;
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
    t<K extends (NestedKeyOf<TranslationObjectFor<S, T, Fallback>> | PluralKeys<S, T, Fallback>) & string>(key: K, ...args: TArgs<K, TranslationObjectFor<S, T, Fallback>, PluralKeys<S, T, Fallback>, F, UseDefaultFormatter>): TResult<K, TranslationObjectFor<S, T, Fallback>, PluralKeys<S, T, Fallback>>;
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
    plural<K extends PluralKeys<S, T, Fallback>>(key: K, values: PluralParamsFor<K, TranslationObjectFor<S, T, Fallback>>, format?: FormatOptions<F, UseDefaultFormatter>): string;
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
    rich<TOutput = any>(key: string, tags: TagInterpolationOptions<TOutput>, values?: InterpolationOptions): (string | TOutput)[];
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
    private invalidateCacheForLang;
    private lookupWithFallback;
    private buildTranslationObject;
    private findTranslation;
    private getPluralRules;
    private checkPlural;
    private interpolate;
    private applyFormat;
    private makeReadOnly;
    private notifySubscribers;
    private isUnsafeObjectKey;
}

export { type Formatter as F, type InterpolationOptions as I, type LocLConfig as L, type NestedKeyOf as N, type PluralParamsFor as P, type ResourceLoader as R, type ScopeType as S, type TranslationObjectFor as T, LocL as a, type LangWithPlurals as b, type ParamsFor as c, type PathValue as d, type IsEmptyParams as e, type PluralKeys as f, type Language as g, type Scope as h };
