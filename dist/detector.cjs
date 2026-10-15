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

// src/detector/index.ts
var detector_exports = {};
__export(detector_exports, {
  attachDetector: () => attachDetector,
  createI18nMiddleware: () => createI18nMiddleware,
  detectAndMatch: () => detectAndMatch,
  detectBrowserLanguage: () => detectBrowserLanguage,
  formatCookieHeader: () => formatCookieHeader,
  getAcceptedLanguages: () => getAcceptedLanguages,
  getHreflangLinks: () => getHreflangLinks,
  handleI18nRouting: () => handleI18nRouting,
  matchLanguage: () => matchLanguage,
  negotiateLanguage: () => negotiateLanguage,
  parseAcceptLanguage: () => parseAcceptLanguage,
  persistLanguage: () => persistLanguage,
  resolveRouteLocale: () => resolveRouteLocale
});
module.exports = __toCommonJS(detector_exports);

// src/detector/middleware.ts
var DEFAULT_IGNORED_EXTENSIONS = /\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|map|txt|xml|woff|woff2|ttf|eot|pdf|json)$/i;
function isPathIgnored(pathname, ignore) {
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/__next")) {
    return true;
  }
  if (DEFAULT_IGNORED_EXTENSIONS.test(pathname)) {
    return true;
  }
  if (!ignore) {
    return false;
  }
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
function parseCookie(cookieHeader) {
  const result = {};
  if (!cookieHeader) {
    return result;
  }
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
function getHreflangLinks(baseUrl, pathname, locales, defaultLocale, prefixStrategy = "as-needed") {
  let end = baseUrl.length;
  while (end > 0 && baseUrl.charCodeAt(end - 1) === 47) {
    end--;
  }
  const cleanBase = end === baseUrl.length ? baseUrl : baseUrl.slice(0, end);
  const cleanPath = pathname === "/" ? "" : pathname.replace(/^\/+/, "/");
  const links = locales.map((locale) => {
    let href;
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
  const defaultHref = prefixStrategy === "always" ? `${cleanBase}/${defaultLocale}${cleanPath}` : `${cleanBase}${cleanPath || "/"}`;
  links.push({
    rel: "alternate",
    hreflang: "x-default",
    href: defaultHref
  });
  return links;
}
function formatCookieHeader(name, value, options) {
  const path = options?.path ?? "/";
  const maxAge = options?.maxAge ?? 31536e3;
  const sameSite = options?.sameSite ?? "lax";
  const secure = options?.secure ? "; Secure" : "";
  const domain = options?.domain ? `; Domain=${options?.domain}` : "";
  return `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAge}; SameSite=${sameSite}${secure}${domain}`;
}
function resolveRouteLocale(request, options) {
  const strategy = options.prefixStrategy ?? "as-needed";
  const cookieName = options.cookieName ?? "NEXT_LOCALE";
  const queryParam = options.queryParam ?? "lang";
  let parsedUrl;
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
  const segments = originalPathname.split("/").filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();
  const matchedPrefix = options.locales.find((l) => l.toLowerCase() === firstSegment) ?? null;
  const localeInPath = matchedPrefix;
  const pathnameWithoutPrefix = matchedPrefix ? "/" + segments.slice(1).join("/") : originalPathname;
  const queryLocale = parsedUrl.searchParams.get(queryParam) || parsedUrl.searchParams.get("locale");
  let cookieLocale;
  if (request.cookies && typeof request.cookies.get === "function") {
    cookieLocale = request.cookies.get(cookieName)?.value;
  } else if (request.cookies && typeof request.cookies === "object" && typeof request.cookies[cookieName] === "string") {
    cookieLocale = request.cookies[cookieName];
  } else {
    const rawHeader = typeof request.headers?.get === "function" ? request.headers.get("cookie") : request.headers?.cookie;
    cookieLocale = parseCookie(rawHeader)[cookieName];
  }
  const acceptHeader = typeof request.headers?.get === "function" ? request.headers.get("accept-language") : request.headers?.["accept-language"];
  const candidate = queryLocale || cookieLocale || acceptHeader;
  const detectedLocale = matchLanguage(candidate, options.locales, options.defaultLocale);
  let targetLocale = localeInPath ?? detectedLocale;
  let shouldRedirect = false;
  let redirectPath = originalPathname;
  if (strategy === "as-needed") {
    if (localeInPath) {
      if (localeInPath.toLowerCase() === options.defaultLocale.toLowerCase()) {
        shouldRedirect = true;
        redirectPath = pathnameWithoutPrefix;
        targetLocale = options.defaultLocale;
      }
    } else {
      if (detectedLocale.toLowerCase() !== options.defaultLocale.toLowerCase()) {
        shouldRedirect = true;
        redirectPath = `/${detectedLocale}${pathnameWithoutPrefix === "/" ? "" : pathnameWithoutPrefix}`;
        targetLocale = detectedLocale;
      } else {
        targetLocale = options.defaultLocale;
      }
    }
  } else if (strategy === "always") {
    if (!localeInPath) {
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
  let redirectUrl;
  if (shouldRedirect) {
    const targetUrl = new URL(parsedUrl.toString());
    targetUrl.pathname = redirectPath;
    redirectUrl = targetUrl.pathname + targetUrl.search;
  }
  const responseHeaders = {
    "x-locl-locale": targetLocale,
    "x-locl-pathname": pathnameWithoutPrefix
  };
  const cookieData = options.setCookie !== false ? {
    name: cookieName,
    value: targetLocale,
    options: options.cookieOptions
  } : void 0;
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
function createI18nMiddleware(options) {
  return function i18nMiddleware(request) {
    const resolution = resolveRouteLocale(request, options);
    if (resolution.isIgnored) {
      return new Response(null, { status: 200, headers: resolution.headers });
    }
    if (resolution.shouldRedirect && resolution.redirectUrl) {
      let finalRedirectUrl;
      try {
        finalRedirectUrl = new URL(resolution.redirectUrl, request.url).toString();
      } catch {
        finalRedirectUrl = resolution.redirectUrl;
      }
      const headers2 = new Headers(resolution.headers);
      headers2.set("Location", finalRedirectUrl);
      if (resolution.cookie) {
        headers2.append(
          "Set-Cookie",
          formatCookieHeader(resolution.cookie.name, resolution.cookie.value, resolution.cookie.options)
        );
      }
      return new Response(null, {
        status: 307,
        headers: headers2
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
var handleI18nRouting = createI18nMiddleware;

// src/detector/index.ts
function parseAcceptLanguage(header) {
  if (!header || typeof header !== "string") {
    return [];
  }
  const results = [];
  const parts = header.split(",");
  for (let i = 0; i < parts.length; i++) {
    const rawPart = parts[i].trim();
    if (!rawPart) {
      continue;
    }
    const segments = rawPart.split(";");
    const lang = segments[0].trim();
    if (!lang) {
      continue;
    }
    let q = 1;
    for (let j = 1; j < segments.length; j++) {
      const match = segments[j].match(/^\s*q\s*=\s*(-?[0-9.]+)/i);
      if (match) {
        const parsedQ = parseFloat(match[1]);
        if (!isNaN(parsedQ)) {
          q = Math.max(0, Math.min(1, parsedQ));
        }
        break;
      }
    }
    results.push({ lang, q });
  }
  return results.sort((a, b) => b.q - a.q);
}
function getAcceptedLanguages(header) {
  return parseAcceptLanguage(header).map((item) => item.lang);
}
function matchLanguage(accepted, supported, fallback) {
  if (!supported || supported.length === 0) {
    return fallback;
  }
  let candidates = [];
  if (typeof accepted === "string") {
    if (accepted.includes(",") || accepted.includes(";")) {
      candidates = parseAcceptLanguage(accepted).map((a) => a.lang);
    } else {
      candidates = [accepted];
    }
  } else if (Array.isArray(accepted)) {
    if (accepted.length > 0 && typeof accepted[0] === "object" && accepted[0] !== null) {
      const list = accepted.slice().sort((a, b) => (b.q ?? 1) - (a.q ?? 1));
      candidates = list.map((item) => item.lang);
    } else {
      candidates = accepted;
    }
  }
  for (const rawCandidate of candidates) {
    const candidate = rawCandidate.trim();
    if (!candidate) {
      continue;
    }
    if (candidate === "*") {
      return supported[0];
    }
    const exact = supported.find((s) => s.toLowerCase() === candidate.toLowerCase());
    if (exact) {
      return exact;
    }
    let current = candidate;
    while (current) {
      const lastSep = Math.max(current.lastIndexOf("-"), current.lastIndexOf("_"));
      if (lastSep === -1) {
        break;
      }
      current = current.slice(0, lastSep);
      const subtagMatch = supported.find((s) => s.toLowerCase() === current.toLowerCase());
      if (subtagMatch) {
        return subtagMatch;
      }
    }
    const prefixCandidate = `${candidate.toLowerCase()}-`;
    const prefixMatch = supported.find((s) => s.toLowerCase().startsWith(prefixCandidate));
    if (prefixMatch) {
      return prefixMatch;
    }
  }
  return fallback;
}
var negotiateLanguage = matchLanguage;
function detectBrowserLanguage(options = {}) {
  const order = options.order ?? [
    "querystring",
    "cookie",
    "localStorage",
    "sessionStorage",
    "navigator",
    "htmlTag"
  ];
  const queryParams = Array.isArray(options.queryParam) ? options.queryParam : [options.queryParam ?? "lang", "locale"];
  const cookieNames = Array.isArray(options.cookieName) ? options.cookieName : [options.cookieName ?? "NEXT_LOCALE", "locale", "lang"];
  const storageKey = options.storageKey ?? "locl_language";
  for (const detector of order) {
    if (options.customDetectors?.[detector]) {
      const val = options.customDetectors[detector]();
      if (val) {
        return val;
      }
      continue;
    }
    if (detector === "querystring") {
      let search = "";
      if (options.url) {
        try {
          const u = typeof options.url === "string" ? new URL(options.url, "http://localhost") : options.url;
          search = u.search;
        } catch {
        }
      } else if (typeof window !== "undefined" && window.location?.search) {
        search = window.location.search;
      }
      if (search) {
        const params = new URLSearchParams(search);
        for (const q of queryParams) {
          const val = params.get(q);
          if (val) {
            return val;
          }
        }
      }
    }
    if (detector === "cookie") {
      let rawCookie = options.cookieString;
      if (rawCookie === void 0 && typeof document !== "undefined") {
        try {
          rawCookie = document.cookie;
        } catch {
        }
      }
      if (rawCookie) {
        for (const name of cookieNames) {
          const escaped = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
          const regex = new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`);
          const match = rawCookie.match(regex);
          if (match && match[1]) {
            try {
              return decodeURIComponent(match[1]);
            } catch {
              return match[1];
            }
          }
        }
      }
    }
    if (detector === "localStorage" && typeof window !== "undefined") {
      try {
        const val = window.localStorage.getItem(storageKey);
        if (val) {
          return val;
        }
      } catch {
      }
    }
    if (detector === "sessionStorage" && typeof window !== "undefined") {
      try {
        const val = window.sessionStorage.getItem(storageKey);
        if (val) {
          return val;
        }
      } catch {
      }
    }
    if (detector === "navigator" && typeof navigator !== "undefined") {
      if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
        return navigator.languages[0];
      }
      if (navigator.language) {
        return navigator.language;
      }
    }
    if (detector === "htmlTag" && typeof document !== "undefined" && document.documentElement) {
      const el = document.documentElement;
      const htmlLang = typeof el.getAttribute === "function" ? el.getAttribute("lang") : el.lang;
      if (htmlLang) {
        return htmlLang;
      }
    }
  }
  return null;
}
function detectAndMatch(supported, fallback, options) {
  const detected = detectBrowserLanguage(options);
  return matchLanguage(detected, supported, fallback);
}
function persistLanguage(language, options = {}) {
  if (!language) {
    return;
  }
  if (options.cookie !== false && (options.cookie !== void 0 || typeof document !== "undefined")) {
    const cookieOpts = typeof options.cookie === "object" && options.cookie !== null ? options.cookie : {};
    const name = cookieOpts.name ?? "NEXT_LOCALE";
    const path = cookieOpts.path ?? "/";
    const maxAge = cookieOpts.maxAge ?? 31536e3;
    const sameSite = cookieOpts.sameSite ?? "lax";
    const secure = cookieOpts.secure ? "; Secure" : "";
    const domain = cookieOpts.domain ? `; Domain=${cookieOpts.domain}` : "";
    const cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(language)}; Path=${path}; Max-Age=${maxAge}; SameSite=${sameSite}${secure}${domain}`;
    if (typeof document !== "undefined") {
      try {
        document.cookie = cookieStr;
      } catch {
      }
    }
  }
  const localKey = options.localStorage === false ? null : typeof options.localStorage === "string" ? options.localStorage : "locl_language";
  if (localKey && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(localKey, language);
    } catch {
    }
  }
  const sessionKey = typeof options.sessionStorage === "string" ? options.sessionStorage : options.sessionStorage ? "locl_language" : null;
  if (sessionKey && typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(sessionKey, language);
    } catch {
    }
  }
  if (options.htmlTag !== false && typeof document !== "undefined" && document.documentElement) {
    try {
      document.documentElement.setAttribute("lang", language);
    } catch {
    }
  }
}
function attachDetector(translator, options = {}) {
  if (options.autoDetect !== false) {
    const supported = Object.keys(translator.resources ?? {});
    const currentLang = translator.getLanguage();
    const detected = detectBrowserLanguage(options);
    if (detected) {
      const best = matchLanguage(detected, supported, currentLang);
      if (best && best !== currentLang) {
        translator.changeLanguage(best);
      }
    }
  }
  const unsubscribe = translator.subscribe((newLang, prevLang) => {
    if (newLang !== prevLang) {
      persistLanguage(newLang, options);
    }
  });
  return unsubscribe;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  attachDetector,
  createI18nMiddleware,
  detectAndMatch,
  detectBrowserLanguage,
  formatCookieHeader,
  getAcceptedLanguages,
  getHreflangLinks,
  handleI18nRouting,
  matchLanguage,
  negotiateLanguage,
  parseAcceptLanguage,
  persistLanguage,
  resolveRouteLocale
});
