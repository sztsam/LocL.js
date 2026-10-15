import type { LocL } from "../LocL.js";

export type DetectorType = "querystring" | "cookie" | "localStorage" | "sessionStorage" | "navigator" | "htmlTag" | (string & {});
export interface DetectorOptions {
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

export interface PersistenceOptions {
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

export interface AcceptedLanguage {
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
export function parseAcceptLanguage(header: string | null | undefined): AcceptedLanguage[] {
  if (!header || typeof header !== "string") {
    return [];
  }

  const results: Required<AcceptedLanguage>[] = [];
  const parts = header.split(",");

  for (let i = 0; i < parts.length; i++) {
    const rawPart = parts[i].trim();
    if (!rawPart) { continue; }

    const segments = rawPart.split(";");
    const lang = segments[0].trim();
    if (!lang) { continue; }

    let q = 1.0;
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

/**
 * Returns an array of parsed language tags sorted by preference from highest to lowest.
 */
export function getAcceptedLanguages(header: string | null | undefined): string[] {
  return parseAcceptLanguage(header).map((item) => item.lang);
}

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
export function matchLanguage(
  accepted: string | string[] | readonly string[] | AcceptedLanguage[] | readonly AcceptedLanguage[] | null | undefined,
  supported: readonly string[],
  fallback: string
): string {
  if (!supported || supported.length === 0) {
    return fallback;
  }

  let candidates: string[] = [];

  if (typeof accepted === "string") {
    if (accepted.includes(",") || accepted.includes(";")) {
      candidates = parseAcceptLanguage(accepted).map((a) => a.lang);
    } else {
      candidates = [accepted];
    }
  } else if (Array.isArray(accepted)) {
    if (accepted.length > 0 && typeof accepted[0] === "object" && accepted[0] !== null) {
      const list = (accepted as AcceptedLanguage[])
        .slice()
        .sort((a, b) => (b.q ?? 1.0) - (a.q ?? 1.0));
      candidates = list.map((item) => item.lang);
    } else {
      candidates = accepted as string[];
    }
  }

  for (const rawCandidate of candidates) {
    const candidate = rawCandidate.trim();
    if (!candidate) { continue; }

    if (candidate === "*") {
      return supported[0];
    }

    // Exact match (case-insensitive)
    const exact = supported.find((s) => s.toLowerCase() === candidate.toLowerCase());
    if (exact) { return exact; }

    // BCP 47 subtag truncation (e.g. de-CH -> de)
    let current = candidate;
    while (current) {
      const lastSep = Math.max(current.lastIndexOf("-"), current.lastIndexOf("_"));
      if (lastSep === -1) { break; }
      current = current.slice(0, lastSep);
      const subtagMatch = supported.find((s) => s.toLowerCase() === current.toLowerCase());
      if (subtagMatch) { return subtagMatch; }
    }

    // Prefix match: requested `de`, supported has `de-DE`
    const prefixCandidate = `${candidate.toLowerCase()}-`;
    const prefixMatch = supported.find((s) => s.toLowerCase().startsWith(prefixCandidate));
    if (prefixMatch) { return prefixMatch; }
  }

  return fallback;
}

export const negotiateLanguage = matchLanguage;

/**
 * Detects the active language from browser environments across query parameters, cookies,
 * localStorage, sessionStorage, navigator, and HTML lang tags according to configurable priority.
 */
export function detectBrowserLanguage(options: DetectorOptions = {}): string | null {
  const order: DetectorType[] = options.order ?? [
    "querystring",
    "cookie",
    "localStorage",
    "sessionStorage",
    "navigator",
    "htmlTag"
  ];

  const queryParams = Array.isArray(options.queryParam)
    ? options.queryParam
    : [options.queryParam ?? "lang", "locale"];

  const cookieNames = Array.isArray(options.cookieName)
    ? options.cookieName
    : [options.cookieName ?? "NEXT_LOCALE", "locale", "lang"];

  const storageKey = options.storageKey ?? "locl_language";

  for (const detector of order) {
    if (options.customDetectors?.[detector]) {
      const val = options.customDetectors[detector]();
      if (val) { return val; }
      continue;
    }

    // Querystring detector
    if (detector === "querystring") {
      let search = "";
      if (options.url) {
        try {
          const u = typeof options.url === "string" ? new URL(options.url, "http://localhost") : options.url;
          search = u.search;
        } catch { }
      } else if (typeof window !== "undefined" && window.location?.search) {
        search = window.location.search;
      }
      if (search) {
        const params = new URLSearchParams(search);
        for (const q of queryParams) {
          const val = params.get(q);
          if (val) { return val; }
        }
      }
    }

    // Cookie detector
    if (detector === "cookie") {
      let rawCookie = options.cookieString;
      if (rawCookie === undefined && typeof document !== "undefined") {
        try {
          rawCookie = document.cookie;
        } catch { }
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

    // localStorage detector
    if (detector === "localStorage" && typeof window !== "undefined") {
      try {
        const val = window.localStorage.getItem(storageKey);
        if (val) { return val; }
      } catch { }
    }

    // SessionStorage detector
    if (detector === "sessionStorage" && typeof window !== "undefined") {
      try {
        const val = window.sessionStorage.getItem(storageKey);
        if (val) { return val; }
      } catch { }
    }

    // navigator detector
    if (detector === "navigator" && typeof navigator !== "undefined") {
      if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
        return navigator.languages[0];
      }
      if (navigator.language) {
        return navigator.language;
      }
    }

    // htmlTag detector
    if (detector === "htmlTag" && typeof document !== "undefined" && document.documentElement) {
      const el = document.documentElement;
      const htmlLang = typeof el.getAttribute === "function" ? el.getAttribute("lang") : el.lang;
      if (htmlLang) { return htmlLang; }
    }
  }

  return null;
}

/**
 * Detects the language from available browser or request signals and resolves the best matching supported language.
 */
export function detectAndMatch(supported: readonly string[], fallback: string, options?: DetectorOptions): string {
  const detected = detectBrowserLanguage(options);
  return matchLanguage(detected, supported, fallback);
}

/**
 * Persists the chosen language to document.cookie, localStorage, sessionStorage, and the HTML document tag.
 */
export function persistLanguage(language: string, options: PersistenceOptions = {}): void {
  if (!language) { return; }

  // Cookie persistence
  if (options.cookie !== false && (options.cookie !== undefined || typeof document !== "undefined")) {
    const cookieOpts = typeof options.cookie === "object" && options.cookie !== null ? options.cookie : {};
    const name = cookieOpts.name ?? "NEXT_LOCALE";
    const path = cookieOpts.path ?? "/";
    const maxAge = cookieOpts.maxAge ?? 31536000; // 1 year
    const sameSite = cookieOpts.sameSite ?? "lax";
    const secure = cookieOpts.secure ? "; Secure" : "";
    const domain = cookieOpts.domain ? `; Domain=${cookieOpts.domain}` : "";
    const cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(language)}; Path=${path}; Max-Age=${maxAge}; SameSite=${sameSite}${secure}${domain}`;

    if (typeof document !== "undefined") {
      try {
        document.cookie = cookieStr;
      } catch { }
    }
  }

  // localStorage persistence
  const localKey = options.localStorage === false ? null : typeof options.localStorage === "string" ? options.localStorage : "locl_language";
  if (localKey && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(localKey, language);
    } catch { }
  }

  // sessionStorage persistence
  const sessionKey = typeof options.sessionStorage === "string" ? options.sessionStorage : options.sessionStorage ? "locl_language" : null;
  if (sessionKey && typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(sessionKey, language);
    } catch { }
  }

  // HTML document tag update
  if (options.htmlTag !== false && typeof document !== "undefined" && document.documentElement) {
    try {
      document.documentElement.setAttribute("lang", language);
    } catch { }
  }
}

/**
 * Attaches automatic language detection and change-language persistence to a LocL instance.
 */
export function attachDetector(
  translator: LocL<any, any, any, any, any>,
  options: DetectorOptions & PersistenceOptions & { autoDetect?: boolean } = {}
): () => void {
  if (options.autoDetect !== false) {
    const supported = Object.keys((translator as any).resources ?? {});
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

export * from "./middleware.js";