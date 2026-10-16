# Language Detection & Route Middleware (`locl-js/detector`)

LocL provides an enterprise-ready detection and routing toolkit in `locl-js/detector`. It handles client-side browser detection, server-side RFC 7231 `Accept-Language` parsing, BCP 47 language negotiation, and zero-boilerplate Web Standard routing middleware for Next.js App Router, Astro, and edge runtimes.

---

## 1. Browser Detection & Auto-Persistence

Detect the visitor's preferred language across query parameters, cookies, storage, or browser settings:

```typescript
import { initLocL } from "locl-js";
import { attachDetector, detectBrowserLanguage } from "locl-js/detector";

const translator = initLocL({
  resources: { en: { hello: "Hello" }, de: { hello: "Hallo" } },
  fallbackLanguage: "en"
});

// Auto-detects language and binds an auto-persistence listener:
const unsubscribe = attachDetector(translator, {
  order: ["querystring", "cookie", "localStorage", "navigator"],
  lookupQuerystring: "lang",
  lookupCookie: "LOCL_LOCALE",
  lookupLocalStorage: "locl_language",
  caches: ["cookie", "localStorage"],
  supportedLanguages: ["en", "de"],
  fallbackLanguage: "en"
});
```

Whenever `translator.changeLanguage("de")` is called, the user's preference is automatically saved to the cookie, `localStorage`, and updates `<html lang="de" dir="ltr">`.

---

## 2. Server-Side `Accept-Language` Parsing (RFC 7231)

Parse the incoming `Accept-Language` HTTP header with full RFC 7231 / RFC 2616 compliance, quality weighting (`q=0.9`), and whitespace tolerance:

```typescript
import { parseAcceptLanguage, getAcceptedLanguages } from "locl-js/detector";

const header = "fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5";

// Returns sorted array with quality weights:
const parsed = parseAcceptLanguage(header);
// [
//   { lang: "fr-CH", q: 1 },
//   { lang: "fr", q: 0.9 },
//   { lang: "en", q: 0.8 },
//   { lang: "de", q: 0.7 },
//   { lang: "*", q: 0.5 }
// ]

// Returns pure ordered language codes:
const langs = getAcceptedLanguages(header);
// ["fr-CH", "fr", "en", "de", "*"]
```

---

## 3. BCP 47 Language Negotiation (`matchLanguage`)

Match user-requested language tags against your supported application locales with subtag truncation and regional prefix fallback:

```typescript
import { matchLanguage } from "locl-js/detector";

const supported = ["en", "de-DE", "fr"];

// Exact match
matchLanguage(["fr"], supported, "en"); // => "fr"

// Subtag truncation (de-DE-Bavaria -> de-DE)
matchLanguage(["de-DE-Bavaria"], supported, "en"); // => "de-DE"

// Regional prefix fallback (de-AT -> de-DE)
matchLanguage(["de-AT"], supported, "en"); // => "de-DE"

// Wildcard fallback
matchLanguage(["*"], supported, "en"); // => "en"
```

---

## 4. Web Standard Route Middleware

LocL's routing middleware is built on standard `Request` and `Response` primitives, making it 100% compatible with **Next.js App Router**, **Astro**, **Cloudflare Workers**, **Fastly Compute**, and **Deno/Bun**.

### Next.js App Router Middleware (`middleware.ts`)

```typescript
// middleware.ts
import { createI18nMiddleware } from "locl-js/detector";

export const middleware = createI18nMiddleware({
  locales: ["en", "de", "fr"],
  defaultLocale: "en",
  prefixStrategy: "as-needed", // Default locale has no prefix, secondary locales get "/de/..."
  cookieName: "NEXT_LOCALE"
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
```

### Prefix Strategies

| Strategy | Default Locale URL | Secondary Locale URL |
| :--- | :--- | :--- |
| **`"as-needed"`** *(Default)* | `/dashboard` (no prefix) | `/de/dashboard`, `/fr/dashboard` |
| **`"always"`** | `/en/dashboard` (always prefixed) | `/de/dashboard`, `/fr/dashboard` |
| **`"never"`** | `/dashboard` (cookie/header routed) | `/dashboard` |

### Path Resolution Helper (`getLocalizedPath`)

Generate localized URLs adhering to prefix strategies:

```typescript
import { getLocalizedPath } from "locl-js/detector";

getLocalizedPath("/about", "de", "en", "as-needed"); // => "/de/about"
getLocalizedPath("/about", "en", "en", "as-needed"); // => "/about"
getLocalizedPath("/about", "en", "en", "always");    // => "/en/about"
```

---

## 5. SEO Alternate Links (`getHreflangLinks`)

Generate Google-recommended `hreflang` alternate links for multi-language search engine indexing:

```typescript
import { getHreflangLinks } from "locl-js/detector";

const links = getHreflangLinks(
  "https://example.com",
  "/pricing",
  ["en", "de", "fr"],
  "en",
  "as-needed"
);

// Generates:
// [
//   { rel: "alternate", hreflang: "en", href: "https://example.com/pricing" },
//   { rel: "alternate", hreflang: "de", href: "https://example.com/de/pricing" },
//   { rel: "alternate", hreflang: "fr", href: "https://example.com/fr/pricing" },
//   { rel: "alternate", hreflang: "x-default", href: "https://example.com/pricing" }
// ]
```
