type PrefixStrategy = "as-needed" | "always" | "never";
interface HreflangLink {
    rel: "alternate";
    hreflang: string;
    href: string;
}
interface I18nRoutingOptions {
    /** Supported locale codes, e.g. ["en", "de", "fr"] */
    locales: readonly string[];
    /** Default/fallback locale, e.g. "en" */
    defaultLocale: string;
    /** Prefix routing strategy: "as-needed" (default) | "always" | "never" */
    prefixStrategy?: PrefixStrategy;
    /** Cookie name to read/persist active locale (default: "NEXT_LOCALE") */
    cookieName?: string;
    /** Path prefixes or patterns to ignore (e.g. ["/api", "/_next", "/favicon.ico"]) */
    ignore?: (string | RegExp)[] | ((pathname: string) => boolean);
    /** Query parameter name to detect locale override (default: "lang") */
    queryParam?: string;
    /** Header name for custom locale override */
    headerName?: string;
    /** Whether to automatically set response cookie on language switch/detection (default: true) */
    setCookie?: boolean;
    /** Cookie options */
    cookieOptions?: {
        maxAge?: number;
        path?: string;
        sameSite?: "lax" | "strict" | "none";
        secure?: boolean;
        domain?: string;
    };
}
interface RouteResolution {
    /** The final active locale for this route */
    locale: string;
    /** The detected preferred locale from headers/cookies/query */
    detectedLocale: string;
    /** Pathname stripped of any locale prefix (e.g. "/about") */
    pathname: string;
    /** Full original pathname (e.g. "/de/about") */
    originalPathname: string;
    /** The locale extracted from the URL path prefix, or null */
    localeInPath: string | null;
    /** Whether the incoming request requires an HTTP redirect */
    shouldRedirect: boolean;
    /** Target URL for the HTTP redirect */
    redirectUrl?: string;
    /** URL for an internal rewrite if redirect is not needed */
    rewriteUrl?: string;
    /** Whether this request matched an ignored asset or API path */
    isIgnored: boolean;
    /** Cookie instructions if a locale cookie should be set */
    cookie?: {
        name: string;
        value: string;
        options?: I18nRoutingOptions["cookieOptions"];
    };
    /** Headers to attach to response or pass down */
    headers: Record<string, string>;
    /**Alternate language/region URLs for SEO hreflang annotations */
    hreflangLinks?: HreflangLink[];
}
declare function getHreflangLinks(baseUrl: string, pathname: string, locales: readonly string[], defaultLocale: string, prefixStrategy?: PrefixStrategy): HreflangLink[];
declare function formatCookieHeader(name: string, value: string, options?: I18nRoutingOptions["cookieOptions"]): string;
/**
 * Resolves routing metadata, prefix inspection, and automatic redirects for full-stack
 * frameworks (Next.js App Router, Astro, Cloudflare, Node servers).
 */
declare function resolveRouteLocale(request: {
    url: string;
    headers?: any;
    cookies?: any;
}, options: I18nRoutingOptions): RouteResolution;
/**
 * Creates a zero-boilerplate Next.js App Router / Astro / standard Web API middleware function.
 *
 * @example
 * ```ts
 * // middleware.ts
 * import { createI18nMiddleware } from "locl-js/detector";
 *
 * export const middleware = createI18nMiddleware({
 *   locales: ["en", "de", "fr"],
 *   defaultLocale: "en",
 *   prefixStrategy: "as-needed"
 * });
 *
 * export const config = {
 *   matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
 * };
 * ```
 */
declare function createI18nMiddleware(options: I18nRoutingOptions): (request: any) => Response;
declare const handleI18nRouting: typeof createI18nMiddleware;

export { type HreflangLink as H, type I18nRoutingOptions as I, type PrefixStrategy as P, type RouteResolution as R, createI18nMiddleware as c, formatCookieHeader as f, getHreflangLinks as g, handleI18nRouting as h, resolveRouteLocale as r };
