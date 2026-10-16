import { S as ScopeType, j as Formatter, k as LocLConfig, L as LocL, E as EnforceParity } from './LocL-Dnobyznm.cjs';
export { l as LangWithPlurals } from './LocL-Dnobyznm.cjs';

interface RemoteLoaderStorage {
    getItem: (key: string) => string | null | Promise<string | null>;
    setItem: (key: string, value: string) => void | Promise<void>;
    removeItem?: (key: string) => void | Promise<void>;
}
type StorageType = "localStorage" | "sessionStorage" | "memory" | RemoteLoaderStorage;
interface RemoteLoaderOptions {
    /**
     * Remote endpoint URL template string or custom resolver function.
     * Supports `{lang}` and `{ns}` placeholders.
     *
     * @example
     * "https://cdn.example.com/locales/{lang}/{ns}.json"
     * (lang, ns) => `https://api.example.com/translations/${lang}${ns ? `?ns=${ns}` : ""}`
     */
    endpoint: string | ((lang: string, ns?: string) => string);
    /**
     * Cache storage: "localStorage" (default in browser), "sessionStorage", "memory", or custom storage object.
     */
    storage?: StorageType;
    /**
     * Storage key prefix. Defaults to "locl_ota_".
     */
    storagePrefix?: string;
    /**
     * Cache time-to-live in milliseconds. Defaults to 24 hours (86,400,000 ms).
     */
    maxAge?: number;
    /**
     * When true, immediately returns stale cached translations while fetching fresh translations in the background.
     * Defaults to true.
     */
    staleWhileRevalidate?: boolean;
    /**
     * Custom fetch implementation (defaults to global fetch).
     */
    fetch?: typeof fetch;
    /**
     * Custom HTTP headers or header resolver function.
     */
    headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
    /**
     * Callback fired when fresh translations are fetched from the remote source.
     */
    onSuccess?: (lang: string, ns: string | undefined, data: Record<string, any>) => void;
    /**
     * Callback fired when remote fetch fails.
     */
    onError?: (err: Error, lang: string, ns: string | undefined) => void;
}
interface RemoteLoaderInstance {
    (lang: string, ns?: string): Promise<Record<string, any>>;
    clearCache: (lang?: string, ns?: string) => Promise<void>;
}
/**
 * Creates an Over-The-Air (OTA) remote translation loader with Stale-While-Revalidate (SWR) caching.
 *
 * Provides instantaneous boot times from local storage cache, silent background updates,
 * and seamless offline fallback.
 *
 * @example
 * ```ts
 * const translator = initLocL({
 *   resources: bundledFallback,
 *   fallbackLanguage: "en",
 *   loader: createRemoteLoader({
 *     endpoint: "https://cdn.example.com/locales/{lang}/{ns}.json",
 *     maxAge: 1000 * 60 * 60 * 24, // 24 hours
 *     staleWhileRevalidate: true
 *   })
 * });
 * ```
 */
declare function createRemoteLoader(options: RemoteLoaderOptions): RemoteLoaderInstance;

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
 * @param {ResourceLoader} [config.loader] - Default async loader function for lazy loading namespaces
 * @param {PseudoLocalizationOptions} [config.pseudoLocalization] - Built-in Pseudo-Localization for enterprise layout & QA testing
 * @param {StrictParams} [config.strictParams] - eliminate recursive template-literal parsing for large codebases while retaining autocomplete
 *
 * @returns A new `LocL` instance configured with the provided options.
 */
declare function initLocL<const T extends Record<string, any>, Fallback extends keyof T & string, S extends ScopeType<T, Fallback> = undefined, F extends Record<string, Formatter> = {}, UseDefaultFormatter extends boolean = true, StrictParams extends boolean = true>(config: LocLConfig<T, Fallback, F> & {
    scope?: S;
    formatters?: F;
    useDefaultFormatters?: UseDefaultFormatter;
    strictParams?: StrictParams;
}): LocL<T, Fallback, S, F, UseDefaultFormatter, StrictParams>;
/**
 * Declares translation resources while keeping their literal types, so that
 * `t()` knows which keys and `{params}` exist. Same effect as `as const`, without writing it.
 *
 * @example
 * ```ts
 * const resources = defineResources({
 *   en: { greeting: "Hello, {name}!" },
 *   de: { greeting: "Hallo, {name}!" }
 * });
 *
 * const translator = initLocL({ resources, fallbackLanguage: "en" });
 * translator.t("greeting", { name: "World" }); // `name` is required and suggested
 * ```
 */
declare function defineResources<const T extends Record<string, any>>(resources: T): T;
/**
 * Declares translation resources and enforces at compile time that every secondary
 * language implements all keys present in the fallback language.
 *
 * @example
 * ```ts
 * const resources = defineStrictResources({
 *   en: { title: "Hello", save: "Save" },
 *   de: { title: "Hallo", save: "Speichern" } // ❌ Error if 'save' is missing in 'de'
 * });
 * ```
 */
declare function defineStrictResources<const T extends Record<string, any>, Fallback extends keyof T & string = "en" extends keyof T ? "en" : keyof T & string>(resources: EnforceParity<T, Fallback>): T;
/**
 * Declares translation resources for enterprise large dictionaries without requiring
 * recursive template-literal parsing.
 */
declare function defineFastResources<const T extends Record<string, any>>(resources: T): T;
/**
 * Flattens a deeply nested translation dictionary object into a single-level object
 * with dot-separated keys at runtime. Plural form objects (e.g. `{ one: "...", other: "..." }`)
 * are preserved as objects for proper pluralization support.
 *
 * Useful for build-time or startup optimization in codebases with 10,000+ keys.
 *
 * @example
 * ```ts
 * const flat = flattenDictionary({
 *   auth: { login: "Log in", welcome: "Hello {name}" },
 *   items: { one: "1 item", other: "{count} items" }
 * });
 * // Result:
 * // {
 * //   "auth.login": "Log in",
 * //   "auth.welcome": "Hello {name}",
 * //   "items": { one: "1 item", other: "{count} items" }
 * // }
 * ```
 */
declare function flattenDictionary(obj: Record<string, any>, prefix?: string): Record<string, any>;
/**
 * Reconstructs a nested object dictionary from flat dot-separated keys.
 * Preserves plural objects intact.
 */
declare function unflattenDictionary(flat: Record<string, any>): Record<string, any>;

export { LocL, LocLConfig, type RemoteLoaderOptions, createRemoteLoader, defineFastResources, defineResources, defineStrictResources, flattenDictionary, initLocL, unflattenDictionary };
