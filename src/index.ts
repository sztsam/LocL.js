import { LocL, LocLConfig } from "./LocL";
import { ScopeType, Formatter, LangWithPlurals } from "./types";

/**
 * A helper type that provides strong typing for your language resources,
 * ensuring that pluralization keys are correctly defined.
 *
 * @example
 * ```ts
 * import { LangWithPlurals } from "lang-pack";
 *
 * const en: LangWithPlurals<typeof en> = {
 *   messages: {
 *     one: "You have one message.",
 *     other: "You have {count} messages."
 *   }
 * };
 * ```
 */
export { LangWithPlurals };
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
export function initLocL<
    T extends Record<string, any>,
    Fallback extends keyof T & string,
    S extends ScopeType<T, Fallback> | undefined = undefined,
    F extends Record<string, Formatter> = {},
    UseDefaultFormatter extends boolean = true
>(config: LocLConfig<T, Fallback> & { scope?: S, formatters?: F, useDefaultFormatters?: UseDefaultFormatter }) {
    return new LocL<T, Fallback, S, F, UseDefaultFormatter>(config);
}