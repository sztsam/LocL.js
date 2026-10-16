import { matchLanguage } from "./index.js";

export type PrefixStrategy = "as-needed" | "always" | "never";

export interface HreflangLink {
  rel: "alternate";
  hreflang: string;
  href: string;
}

export interface I18nRoutingOptions {
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

export interface RouteResolution {
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

const DEFAULT_IGNORED_EXTENSIONS = /\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|map|txt|xml|woff|woff2|ttf|eot|pdf|json)$/i;

function isPathIgnored(pathname: string, ignore?: (string | RegExp)[] | ((pathname: string) => boolean)): boolean {
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/__next")) {
    return true;
  }
  if (DEFAULT_IGNORED_EXTENSIONS.test(pathname)) {
    return true;
  }
  if (!ignore) { return false; }

  if (typeof ignore === "function") {
    return ignore(pathname);
  }

  for (const item of ignore) {
    if (typeof item === "string" && pathname.startsWith(item)) {
      return true;
    }
    if (item instanceof RegExp && item.test(pathname)) {
      return true;
    }
  }
  return false;
}

function parseCookie(cookieHeader?: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) { return result; }
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx !== -1) {
      const key = part.slice(0, eqIdx).trim();
      const val = part.slice(eqIdx + 1).trim();
      if (key && val) {
        try {
          result[key] = decodeURIComponent(val);
        } catch {
          result[key] = val;
        }
      }
    }
  }
  return result;
}

export function getHreflangLinks(baseUrl: string, pathname: string, locales: readonly string[], defaultLocale: string, prefixStrategy: PrefixStrategy = "as-needed"): HreflangLink[] {
  let end = baseUrl.length;
  while (end > 0 && baseUrl.charCodeAt(end - 1) === 47 /* '/' */) { end--; }
  const cleanBase = end === baseUrl.length ? baseUrl : baseUrl.slice(0, end);
  const cleanPath = pathname === "/" ? "" : pathname.replace(/^\/+/, "/");

  const links: HreflangLink[] = locales.map((locale) => {
    let href: string;
    if (prefixStrategy === "as-needed" && locale.toLowerCase() === defaultLocale.toLowerCase()) {
      href = `${cleanBase}${cleanPath || "/"}`;
    } else if (prefixStrategy === "never") {
      href = `${cleanBase}${cleanPath || "/"}`;
    } else {
      href = `${cleanBase}/${locale}${cleanPath}`;
    }
    return {
      rel: "alternate",
      hreflang: locale,
      href
    };
  });

  const defaultHref = prefixStrategy === "always"
    ? `${cleanBase}/${defaultLocale}${cleanPath}`
    : `${cleanBase}${cleanPath || "/"}`;

  links.push({
    rel: "alternate",
    hreflang: "x-default",
    href: defaultHref
  });

  return links;
}

export function getLocalizedPath(pathname: string, locale: string, defaultLocale: string, prefixStrategy: PrefixStrategy = "as-needed", locales?: readonly string[]): string {
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = cleanPath.split("/").filter(Boolean);
  const first = segments[0]?.toLowerCase();

  const isLocaleInPath = locales
    ? locales.some((l) => l.toLowerCase() === first)
    : (first === locale.toLowerCase() ||
      first === defaultLocale.toLowerCase() ||
      (first !== undefined && /^[a-z]{2}(-[a-z0-9]+)*$/i.test(first)));

  const pathWithoutLocale = isLocaleInPath
    ? "/" + segments.slice(1).join("/")
    : cleanPath;

  if (prefixStrategy === "as-needed") {
    if (locale.toLowerCase() === defaultLocale.toLowerCase()) {
      return pathWithoutLocale;
    }
    return `/${locale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
  }
  if (prefixStrategy === "always") {
    return `/${locale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
  }
  return pathWithoutLocale;
}

export function formatCookieHeader(name: string, value: string, options?: I18nRoutingOptions["cookieOptions"]): string {
  const path = options?.path ?? "/";
  const maxAge = options?.maxAge ?? 31536000; // 1 year
  const sameSite = options?.sameSite ?? "lax";
  const secure = options?.secure ? "; Secure" : "";
  const domain = options?.domain ? `; Domain=${options?.domain}` : "";
  return `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAge}; SameSite=${sameSite}${secure}${domain}`;
}

/**
 * Resolves routing metadata, prefix inspection, and automatic redirects for full-stack
 * frameworks (Next.js App Router, Astro, Cloudflare, Node servers).
 */
export function resolveRouteLocale(request: { url: string; headers?: any; cookies?: any }, options: I18nRoutingOptions): RouteResolution {
  const strategy = options.prefixStrategy ?? "as-needed";
  const cookieName = options.cookieName ?? "NEXT_LOCALE";
  const queryParam = options.queryParam ?? "lang";

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(request.url, "http://localhost");
  } catch {
    const pathPart = String(request.url).replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/?#]*/, "");
    parsedUrl = new URL("/" + pathPart.replace(/^\/+/, ""), "http://localhost");
  }

  const originalPathname = parsedUrl.pathname;

  if (isPathIgnored(originalPathname, options.ignore)) {
    return {
      locale: options.defaultLocale,
      detectedLocale: options.defaultLocale,
      pathname: originalPathname,
      originalPathname,
      localeInPath: null,
      shouldRedirect: false,
      isIgnored: true,
      headers: {}
    };
  }

  // Inspect pathname for locale prefix: e.g. /de/about or /de
  const segments = originalPathname.split("/").filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();
  const matchedPrefix = options.locales.find((l) => l.toLowerCase() === firstSegment) ?? null;

  const localeInPath = matchedPrefix;
  const pathnameWithoutPrefix = matchedPrefix
    ? "/" + segments.slice(1).join("/")
    : originalPathname;

  // Detect preferred locale from signals: Query > Cookie > Header
  const queryLocale = parsedUrl.searchParams.get(queryParam) || parsedUrl.searchParams.get("locale");
  let cookieLocale: string | undefined;
  if (request.cookies && typeof request.cookies.get === "function") {
    cookieLocale = request.cookies.get(cookieName)?.value;
  } else if (request.cookies && typeof request.cookies === "object" && typeof request.cookies[cookieName] === "string") {
    cookieLocale = request.cookies[cookieName];
  } else {
    const rawHeader = typeof request.headers?.get === "function"
      ? request.headers.get("cookie")
      : request.headers?.cookie;
    cookieLocale = parseCookie(rawHeader)[cookieName];
  }

  const acceptHeader = typeof request.headers?.get === "function"
    ? request.headers.get("accept-language")
    : request.headers?.["accept-language"];

  const candidate = queryLocale || cookieLocale || acceptHeader;
  const detectedLocale = matchLanguage(candidate, options.locales, options.defaultLocale);

  let targetLocale = localeInPath ?? detectedLocale;
  let shouldRedirect = false;
  let redirectPath = originalPathname;

  if (strategy === "as-needed") {
    if (localeInPath) {
      if (localeInPath.toLowerCase() === options.defaultLocale.toLowerCase()) {
        // Default locale MUST NOT have prefix: /en/about -> redirect to /about
        shouldRedirect = true;
        redirectPath = pathnameWithoutPrefix;
        targetLocale = options.defaultLocale;
      }
    } else {
      if (detectedLocale.toLowerCase() !== options.defaultLocale.toLowerCase()) {
        // Preferred locale is non-default and user visited unprefixed route: /about -> redirect to /de/about
        shouldRedirect = true;
        redirectPath = `/${detectedLocale}${pathnameWithoutPrefix === "/" ? "" : pathnameWithoutPrefix}`;
        targetLocale = detectedLocale;
      } else {
        targetLocale = options.defaultLocale;
      }
    }
  } else if (strategy === "always") {
    if (!localeInPath) {
      // All routes require prefix: /about -> redirect to /en/about
      shouldRedirect = true;
      redirectPath = `/${detectedLocale}${pathnameWithoutPrefix === "/" ? "" : pathnameWithoutPrefix}`;
      targetLocale = detectedLocale;
    }
  } else if (strategy === "never") {
    if (localeInPath) {
      shouldRedirect = true;
      redirectPath = pathnameWithoutPrefix;
      targetLocale = localeInPath;
    } else {
      targetLocale = detectedLocale;
    }
  }

  let redirectUrl: string | undefined;
  if (shouldRedirect) {
    const targetUrl = new URL(parsedUrl.toString());
    targetUrl.pathname = redirectPath;
    redirectUrl = targetUrl.pathname + targetUrl.search;
  }

  const responseHeaders: Record<string, string> = {
    "x-locl-locale": targetLocale,
    "x-locl-pathname": pathnameWithoutPrefix
  };

  const cookieData = options.setCookie !== false
    ? {
      name: cookieName,
      value: targetLocale,
      options: options.cookieOptions
    }
    : undefined;

  const baseUrl = parsedUrl.origin;
  const hreflangLinks = getHreflangLinks(
    baseUrl,
    pathnameWithoutPrefix,
    options.locales,
    options.defaultLocale,
    strategy
  );

  return {
    locale: targetLocale,
    detectedLocale,
    pathname: pathnameWithoutPrefix,
    originalPathname,
    localeInPath,
    shouldRedirect,
    redirectUrl,
    rewriteUrl: pathnameWithoutPrefix,
    isIgnored: false,
    cookie: cookieData,
    headers: responseHeaders,
    hreflangLinks
  };
}

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
export function createI18nMiddleware(options: I18nRoutingOptions) {
  return function i18nMiddleware(request: any): Response {
    const resolution = resolveRouteLocale(request, options);

    if (resolution.isIgnored) {
      return new Response(null, { status: 200, headers: resolution.headers });
    }

    if (resolution.shouldRedirect && resolution.redirectUrl) {
      let finalRedirectUrl: string;
      try {
        finalRedirectUrl = new URL(resolution.redirectUrl, request.url).toString();
      } catch {
        finalRedirectUrl = resolution.redirectUrl;
      }

      const headers = new Headers(resolution.headers);
      headers.set("Location", finalRedirectUrl);

      if (resolution.cookie) {
        headers.append(
          "Set-Cookie",
          formatCookieHeader(resolution.cookie.name, resolution.cookie.value, resolution.cookie.options)
        );
      }

      return new Response(null, {
        status: 307,
        headers
      });
    }

    const headers = new Headers(resolution.headers);
    if (resolution.cookie) {
      headers.append(
        "Set-Cookie",
        formatCookieHeader(resolution.cookie.name, resolution.cookie.value, resolution.cookie.options)
      );
    }

    return new Response(null, {
      status: 200,
      headers
    });
  };
}

export const handleI18nRouting = createI18nMiddleware;
