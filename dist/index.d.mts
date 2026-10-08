import { S as ScopeType, F as Formatter, L as LocLConfig, a as LocL } from './LocL-fN9Yari8.mjs';
export { b as LangWithPlurals } from './LocL-fN9Yari8.mjs';

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
declare function initLocL<const T extends Record<string, any>, Fallback extends keyof T & string, S extends ScopeType<T, Fallback> = undefined, F extends Record<string, Formatter> = {}, UseDefaultFormatter extends boolean = true>(config: LocLConfig<T, Fallback> & {
    scope?: S;
    formatters?: F;
    useDefaultFormatters?: UseDefaultFormatter;
}): LocL<T, Fallback, S, F, UseDefaultFormatter>;
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

export { LocL, LocLConfig, defineResources, initLocL };
