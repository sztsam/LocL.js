import { L as LocL } from './LocL-Dnobyznm.cjs';
export { H as HreflangLink, I as I18nRoutingOptions, P as PrefixStrategy, R as RouteResolution, c as createI18nMiddleware, f as formatCookieHeader, g as getHreflangLinks, a as getLocalizedPath, h as handleI18nRouting, r as resolveRouteLocale } from './middleware-DHb1prPZ.cjs';

type DetectorType = "querystring" | "cookie" | "localStorage" | "sessionStorage" | "navigator" | "htmlTag" | (string & {});
interface DetectorOptions {
    /** The sequence of detectors to run in priority order. */
    order?: DetectorType[];
    /** Query parameter name(s) to inspect in browser or URL (default: ["lang", "locale"]) */
    queryParam?: string | string[];
    /** Cookie name(s) to inspect (default: ["NEXT_LOCALE", "locale", "lang"]) */
    cookieName?: string | string[];
    /** Key to inspect in localStorage/sessionStorage (default: "locl_language") */
    storageKey?: string;
    /** Custom detectors returning a language code or null/undefined */
    customDetectors?: Record<string, () => string | null | undefined>;
    /** Optional manual URL override for testing or non-browser request detection */
    url?: string | URL;
    /** Optional manual cookie string override */
    cookieString?: string;
}
interface PersistenceOptions {
    /** Cookie persistence settings, or false to disable cookie persistence */
    cookie?: {
        name?: string;
        path?: string;
        maxAge?: number;
        sameSite?: "lax" | "strict" | "none";
        secure?: boolean;
        domain?: string;
    } | false;
    /** Whether to persist to localStorage, or custom key name (default: "locl_language") */
    localStorage?: boolean | string;
    /** Whether to persist to sessionStorage, or custom key name (default: false) */
    sessionStorage?: boolean | string;
    /** Automatically update document.documentElement.lang (default: true) */
    htmlTag?: boolean;
}
interface AcceptedLanguage {
    lang: string;
    q?: number;
}
/**
 * Parses an RFC 7231 / RFC 2616 `Accept-Language` header string into weighted language tags,
 * correctly handling q-factor weights, wildcards, and whitespace.
 *
 * @example
 * ```ts
 * parseAcceptLanguage("en-US,en;q=0.9,de;q=0.8,fr;q=0.7");
 * // => [
 * //   { lang: "en-US", q: 1.0 },
 * //   { lang: "en", q: 0.9 },
 * //   { lang: "de", q: 0.8 },
 * //   { lang: "fr", q: 0.7 }
 * // ]
 * ```
 */
declare function parseAcceptLanguage(header: string | null | undefined): AcceptedLanguage[];
/**
 * Returns an array of parsed language tags sorted by preference from highest to lowest.
 */
declare function getAcceptedLanguages(header: string | null | undefined): string[];
/**
 * Negotiates the best matching language from requested preferences against available
 * supported languages according to BCP 47 matching heuristics.
 *
 * Matching priority:
 * 1. Exact match (case-insensitive)
 * 2. Truncated BCP 47 subtag (e.g. `de-AT-Vienna` -> `de-AT` -> `de`)
 * 3. Primary language subtag prefix match (e.g. requested `en`, supported has `en-US`)
 * 4. Fallback default language
 */
declare function matchLanguage(accepted: string | string[] | readonly string[] | AcceptedLanguage[] | readonly AcceptedLanguage[] | null | undefined, supported: readonly string[], fallback: string): string;
declare const negotiateLanguage: typeof matchLanguage;
/**
 * Detects the active language from browser environments across query parameters, cookies,
 * localStorage, sessionStorage, navigator, and HTML lang tags according to configurable priority.
 */
declare function detectBrowserLanguage(options?: DetectorOptions): string | null;
/**
 * Detects the language from available browser or request signals and resolves the best matching supported language.
 */
declare function detectAndMatch(supported: readonly string[], fallback: string, options?: DetectorOptions): string;
/**
 * Persists the chosen language to document.cookie, localStorage, sessionStorage, and the HTML document tag.
 */
declare function persistLanguage(language: string, options?: PersistenceOptions): void;
/**
 * Attaches automatic language detection and change-language persistence to a LocL instance.
 */
declare function attachDetector(translator: LocL<any, any, any, any, any>, options?: DetectorOptions & PersistenceOptions & {
    autoDetect?: boolean;
}): () => void;

export { type AcceptedLanguage, type DetectorOptions, type DetectorType, type PersistenceOptions, attachDetector, detectAndMatch, detectBrowserLanguage, getAcceptedLanguages, matchLanguage, negotiateLanguage, parseAcceptLanguage, persistLanguage };
