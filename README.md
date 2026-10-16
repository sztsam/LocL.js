# LocL.js 🌐

[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/sztsam/LocL.js) [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://www.npmjs.com/package/locl-js)

**LocL** is an ultra-fast, lightweight, and fully-featured TypeScript internationalization (i18n) library. Designed for modern web applications, server environments, and full-stack frameworks, it provides compile-time type safety, pre-compiled template execution, automatic pluralization with exact quantities, ordinal numbers, automated language detection and routing middleware, developer CLI tooling, RTL script detection, built-in formatters with pipeline chaining, and reactive subscriptions with **zero external dependencies**.

---

## Features ✨

- **🚀 10x–20x Execution Throughput**: Compiled token cache memoizes template execution plans on first lookup, eliminating regex scanning and string splitting in the hot path.
- **🛠️ Built-in Developer CLI (`locl`)**: Automatic key extraction from source files (`extract`), CI translation parity validation (`check`), visual coverage matrix reports (`status`), automated machine translation (`translate`), and Ahead-of-Time bundling (`compile`).
- **🤖 Automated AI & Machine Translation (`locl translate`)**: Batch translate missing keys via DeepL, OpenAI (GPT-4o), Google Cloud Translation, or local Ollama (Llama 3), with token masking ensuring `{name}` and `<bold>` tags are never altered.
- **🛡️ Parameter & Tag Parity Linting (`locl check --lint-params`)**: CI linting that verifies variable placeholders (`{var}`) and XML/JSX tags (`<link>`) match 1:1 between base and secondary language translations.
- **🔀 ICU Inline Plural Syntax & Offsets**: Standard ICU inline plural syntax `{count, plural, offset:1 =0 {...} one {# item} other {# items}}` with `#` number replacement, exact quantity selectors, and strict type safety.
- **📡 Over-The-Air (OTA) Remote Loader (`createRemoteLoader`)**: High-performance remote bundle loader with Stale-While-Revalidate (SWR) caching, instant offline booting via localStorage/sessionStorage/memory, and background refreshes.
- **⚡ Vite Plugin & Hot Module Replacement (`locl-js/vite`)**: Instant Hot Module Replacement for translation JSON dictionaries without full browser page reloads.
- **🧡 First-Class Svelte & Vue 3 Integrations (`locl-js/svelte`, `locl-js/vue`)**: Native reactive stores and composables (`$t` in Svelte 4/5, `createLocLVue` with `ref` support).
- **💧 SSR Hydration & Localized Links (`locl-js/react`)**: `<LocLHydrate />` for zero-flicker SSR hydration without layout shifts, alongside prefix-aware `<Link />` and `useLocalizedPath()`.
- **📋 Extended Built-in Formatters**: Native `Intl.ListFormat` (`{items | list}`) and `Intl.DisplayNames` (`languageName`, `regionName`, `currencyName`, `displayName`).
- **🌐 Universal Language Detector & Route Middleware (`locl-js/detector`)**: Browser detection across query parameters, cookies, storage, and navigator; RFC 7231 `Accept-Language` parsing; BCP 47 negotiation; and Web Standard middleware for Next.js App Router, Astro, and Node.js with automated prefix routing (`as-needed`, `always`, `never`) and SEO `hreflang` generation.
- **🥇 Native Ordinal Pluralization (`1st`, `2nd`, `3rd`, `4th`)**: Support for ordinal numbers (`translator.ordinal()`) using native `Intl.PluralRules({ type: "ordinal" })` across dual-mode plural objects and suffix forms.
- **🖥️ React Server Components & Full-Stack (`locl-js/server`)**: Headless async request isolation via Node's `AsyncLocalStorage` for React Server Components, Next.js App Router (no `"use client"`!), Astro, Remix, and backend routes.
- **🏎️ Safe Type Mode for Huge Dictionaries (`strictParams: false`)**: Disable recursive template-literal parsing for codebases with 10,000+ keys to maximize `tsc` speed while retaining 100% key autocompletion and path validation.
- **📑 Pre-Flattened Dictionary Utilities**: `FlattenKeys<T>`, `PreFlattened<T>`, `flattenDictionary()`, and `unflattenDictionary()` for compile-time and runtime optimization across enterprise setups.
- **💪 Strict Compile-Time Safety**: Auto-extracts parameters (`{name}`, `{{name}}`, `{gender, select, ...}`) and enforces required arguments at compile time with full IDE autocomplete.
- **🏷️ `defineResources` & `defineStrictResources`**: Preserves literal types without `as const` and enforces complete translation parity across all secondary languages at compile time.
- **🌍 Language-Aware CLDR Plural Typing (`LangWithPlurals<T, L>`)**: Enforces CLDR-correct plural categories per language (e.g., `ja`/`zh` require only `other`; `ru`/`pl` require `one`/`few`/`many`/`other`; `en`/`de` require `one`/`other`).
- **🔢 Plural Exact Quantities (`=0`, `=1`, `=N`)**: Define exact numeric exceptions alongside standard CLDR categories (`zero`, `one`, `other`) across both object and suffix plurals.
- **🧭 Built-in RTL & Direction Utilities**: Automatic script-direction detection (`translator.getDirection()`, `translator.isRTL()`) with automatic browser `<html dir="..." lang="...">` synchronization.
- **⚡ Lazy Loading & React `<Suspense>`**: Load monolithic language files (`de.json`) or modular namespaces (`de/dashboard.json`) asynchronously on demand with `<Suspense>` or non-suspense `ready` status.
- **⚛️ First-Class React Integration**: Official React bindings (`<LocLProvider>`, `useTranslation`, `useLocL`, `<Trans />`) via `locl-js/react` with concurrent-safe `useSyncExternalStore` and store versioning:
  - **`createLocLReact` Hook Factory**: Zero-declaration, pre-bound React suite.
  - **`LocLRegister` Declaration Merging**: Ambient global autocomplete for standalone imports.
  - **Tag Attribute Support**: `<Trans />` and `rich()` parse elements with attributes (`<link href="/terms">terms</link>`).
- **📦 Zero Dependencies & Lightweight**: Pure TypeScript with no runtime dependencies.
- **🔄 Drop-in i18next Compat**: Swap existing `i18next` codebases effortlessly using `locl-js/compat` without rewriting call sites. Supports colon namespaces (`auth:login`), strict parameter checking, dynamic bundle preloading, `dir()`, and default fallbacks.
- **🌐 Multi-Framework Reactive Store**: Implements the standard reactive store contract via `translator.subscribe()`, working out of the box in Svelte, Vue, Solid, and Node.js.
- **🔀 ICU Select Support**: Conditional branching (`{gender, select, male {He} female {She} other {They}}`) with nested parameter interpolation (`{gender, select, male {He has {count} items}}`).
- **🔧 Multi-Pipe Formatter Chaining**: Format dates, numbers, currencies, strings, and booleans inline via pipe syntax (`{val | number}`, `{date | date:short}`). Chain multiple formatters sequentially (`{val | trim | upper | truncate:10}`).
- **🧪 Built-in Pseudo-Localization**: Enterprise QA mode to test layout expansion and unlocalized strings without third-party tooling, preserving tags and interpolation tokens.
- **📡 Telemetry Hook (`onMissingKey`)**: Production callback to track missing translation keys and plural categories in real-time.
- **🛡️ Prototype-Safe Dynamic Resources**: Safely merge resources dynamically at runtime with built-in prototype pollution guards and type-evolved translator instances.
- **💯 100% Test Coverage**: Fully verified across every line, branch, function, and edge case.

---

## Installation

```bash
npm install locl-js
```

---

## Quick Start

```typescript
import { initLocL, defineResources } from "locl-js";

// defineResources automatically infers literal types for compile-time safety
const resources = defineResources({
  en: {
    hello: "Hello, {name}!",
    cart: {
      "=0": "Your cart is empty.",
      one: "You have 1 item.",
      other: "You have {count} items.",
    },
    rank: {
      one: "{count}st place",
      two: "{count}nd place",
      few: "{count}rd place",
      other: "{count}th place"
    },
    liked: "{count, plural, offset:1 =0 {No likes} =1 {You liked this} other {You and # others}}",
    auth: { login: "Log In", register: "Sign Up" },
    dashboard: { welcome: "Welcome, {name}" },
  },
  fr: {
    hello: "Bonjour, {name}!",
    cart: {
      "=0": "Votre panier est vide.",
      one: "Vous avez un article.",
      other: "Vous avez {count} articles.",
    },
    rank: {
      one: "{count}er place",
      other: "{count}e place"
    },
    liked: "{count, plural, offset:1 =0 {Aucun j'aime} =1 {Vous aimez ceci} other {Vous et # autres}}",
    auth: { login: "Se connecter", register: "S'inscrire" },
    dashboard: { welcome: "Bienvenue, {name}" },
  }
});

const translator = initLocL({
  resources,
  fallbackLanguage: "en",
});

// Interpolation
console.log(translator.t("hello", { name: "Alice" })); // "Hello, Alice!"

// Plurals via t() or plural()
console.log(translator.t("cart", { count: 0 })); // "Your cart is empty."
console.log(translator.t("cart", { count: 1 })); // "You have 1 item."
console.log(translator.plural("cart", { count: 5 })); // "You have 5 items."

// ICU Inline Plurals with offset & # formatting
console.log(translator.t("liked", { count: 1 })); // "You liked this"
console.log(translator.t("liked", { count: 5 })); // "You and 4 others"

// Ordinal Plurals (1st, 2nd, 3rd...)
console.log(translator.ordinal("rank", { count: 1 })); // "1st place"
console.log(translator.ordinal("rank", { count: 2 })); // "2nd place"
console.log(translator.ordinal("rank", { count: 4 })); // "4th place"

// Direction & RTL detection
console.log(translator.getDirection()); // "ltr"
console.log(translator.isRTL());        // false

// Switch language (automatically updates <html dir="..." lang="..."> in browsers)
translator.changeLanguage("fr");
console.log(translator.t("hello", { name: "Alice" })); // "Bonjour, Alice!"

// Fixed-language proxy (pinned to French regardless of global language)
const frDashboardT = translator.withConfig({ scope: "dashboard", language: "fr" });
console.log(frDashboardT.t("welcome", { name: "Hans" })); // "Bienvenue, Hans"

// String / Array scope (combines multiple namespaces)
const multiT = translator.withConfig({ scope: ["auth", "dashboard"] });
console.log(multiT.t("dashboard.welcome", { name: "Alice" })); // "Bienvenue, Alice"
```

---

## Developer CLI & Localization Pipeline (`locl`)

LocL includes an end-to-end command-line interface for maintaining localization files across codebases without external tooling.

Add scripts to your `package.json`:

```json
{
  "scripts": {
    "i18n:extract": "locl extract",
    "i18n:check": "locl check",
    "i18n:translate": "locl translate",
    "i18n:status": "locl status",
    "i18n:compile": "locl compile"
  }
}
```

### 1. `locl extract` (Key Extraction)

Scans your source files (`.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, `.svelte`) and synchronizes translation keys into your base language file (`locales/en.json`):

```bash
# Scans src/, app/, pages/, components/ and updates locales/en.json
npx locl extract

# Custom source directory, extensions, and default value generator
npx locl extract --src src --ext ts,tsx --locales locales --base en --default "TODO"

# Prune orphaned keys that are no longer used in code
npx locl extract --clean

# Generate flat dot-notated keys instead of nested objects
npx locl extract --flat
```

Extracts from:
- Method calls: `t("key")`, `tt("key")`, `plural("key", ...)`, `ordinal("key", ...)`, `rich("key", ...)`, `get("key")`, `getObj("key")`
- JSX components: `<Trans i18nKey="key" fallback="Default value" />`

### 2. `locl check` (CI Translation Parity & Parameter Linting)

Validates that all secondary language files implement every key present in the base language dictionary. Perfect for pull requests and CI pipelines:

```bash
# Fails with exit code 1 if any language is missing keys
npx locl check --locales locales --base en

# Strict mode: also fails on extraneous (orphaned) or empty string keys
npx locl check --strict

# Lint interpolation parameters and XML/JSX tags across languages
npx locl check --lint-params

# Automatically backfill missing keys from the base language
npx locl check --fix
```

#### Parameter & Markup Tag Linting (`--lint-params` / `--lint`)

Catches runtime bugs caused by mismatched placeholders or broken markup in translations. LocL extracts all template interpolation tokens (`{name}`, `{count | number}`) and XML/JSX tags (`<bold>`, `<link>`) from the base language and verifies that secondary languages match them exactly:

```text
LocL Parity Report (Base: en, 150 keys):
  • [es] ✖ Parameter/Tag Mismatches detected:
      Key: "welcome_message" -> Base params: ["name"], Target params: ["user"]
      Key: "terms_agreement" -> Base tags: ["link"], Target tags: []
```

### 3. `locl translate` (Automated AI & Machine Translation)

Automatically translates missing keys from your base language dictionary into target languages using modern AI and machine translation providers:

```bash
# Translate missing keys into Spanish and German using DeepL (default provider)
npx locl translate --target es,de

# Use OpenAI (default model: gpt-4o-mini)
npx locl translate --target es,fr --provider openai

# Use a local Ollama instance (e.g. llama3) with zero cloud dependencies or costs
npx locl translate --target de,ja --provider ollama --model llama3

# Use Google Cloud Translation API
npx locl translate --target zh,it --provider google

# Force re-translation of all keys even if already translated
npx locl translate --target es --force

# Dry run: preview translations without writing changes to disk
npx locl translate --target es --dry-run
```

#### Supported Translation Providers & Credentials

| Provider | `--provider` | Default Model / Endpoint | Environment Variable / Flag |
| :--- | :--- | :--- | :--- |
| **DeepL** | `deepl` *(default)* | DeepL API Free / Pro | `DEEPL_API_KEY` or `--api-key` |
| **OpenAI** | `openai` | `gpt-4o-mini` (`--model`) | `OPENAI_API_KEY` or `--api-key` |
| **Google Cloud** | `google` | Google Translate v2 REST API | `GOOGLE_TRANSLATE_API_KEY` or `--api-key` |
| **Ollama** | `ollama` | `llama3` (`http://localhost:11434`) | `OLLAMA_HOST` or `--ollama-host` |

#### Smart Token & Markup Masking

Translation APIs often mangle variable tokens (turning `{count}` into `{cuenta}` or `{ contar }`) and corrupt markup tags (`<link>` into `<enlace>`). LocL automatically detects and shields all placeholders (`{name}`, `{{name}}`, `{var | formatter}`) and XML/JSX tags (`<bold>...</bold>`, `<br />`) with collision-proof masks (`__LOCL_TOK_0__`) before sending them to the provider, restoring them with pixel perfection in the translated result.

### 4. `locl status` (Translation Matrix & Coverage)

Displays a visual report of translation completion across all languages:

```bash
npx locl status --locales locales --base en
```

Output:
```text
LocL Translation Coverage (Base: en, 150 keys):
  • [en] 100% [████████████████████] 150/150 keys (0 missing)
  • [de]  96% [███████████████████░] 144/150 keys (6 missing)
  • [fr]  80% [████████████████░░░░] 120/150 keys (30 missing)
```

### 5. `locl compile` (Ahead-of-Time Compilation)

Bundles JSON locale files into an optimized TypeScript or JavaScript file for production zero-overhead imports:

```bash
# Compile to TypeScript bundle (exports typed resources)
npx locl compile --format ts --output src/locales.compiled.ts

# Compile to ESM or CommonJS
npx locl compile --format esm --output dist/locales.js
npx locl compile --format cjs --output dist/locales.cjs
```

### Programmatic CLI API

All CLI operations are available programmatically from `"locl-js/cli"`:

```typescript
import {
  extractKeys,
  checkTranslations,
  compileTranslations,
  getTranslationStatus,
  translateTranslations,
  maskTokens,
  unmaskTokens,
  translateBatchWithProvider
} from "locl-js/cli";

// Automated parity check in CI:
const checkResult = checkTranslations({
  localesDir: "locales",
  baseLang: "en",
  lintParams: true
});

if (!checkResult.success) {
  console.error("Missing translations or parameter mismatches:", checkResult.locales);
}

// Programmatic machine translation:
await translateTranslations({
  target: ["es", "de"],
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o-mini"
});
```

---

## Universal Language Detector & Routing Middleware (`locl-js/detector`)

LocL provides complete language detection, persistence, negotiation, and full-stack route middleware via `locl-js/detector`.

### 1. Browser Detection & Auto-Persistence

Detect user language across multiple signals and persist updates automatically:

```typescript
import { initLocL } from "locl-js";
import { attachDetector, detectBrowserLanguage, persistLanguage } from "locl-js/detector";

const translator = initLocL({
  resources: { en: { title: "Hello" }, de: { title: "Hallo" } },
  fallbackLanguage: "en"
});

// Automatically detects initial language and persists changes to cookie & localStorage
const unsubscribe = attachDetector(translator, {
  order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
  cookie: { name: "NEXT_LOCALE", maxAge: 31536000 },
  localStorage: "locl_language",
  htmlTag: true, // Auto-syncs <html lang="...">
});
```

### 2. RFC 7231 `Accept-Language` Parsing & BCP 47 Negotiation

Parse weighted HTTP headers and negotiate the optimal locale using BCP 47 truncation:

```typescript
import { parseAcceptLanguage, matchLanguage } from "locl-js/detector";

// Parse RFC 7231 Accept-Language header into weighted tags
const accepted = parseAcceptLanguage("en-US,en;q=0.9,de-AT;q=0.8,fr;q=0.7");
// => [{ lang: "en-US", q: 1.0 }, { lang: "en", q: 0.9 }, { lang: "de-AT", q: 0.8 }, ...]

// Negotiate best match with BCP 47 subtag truncation (de-AT -> de)
const supported = ["en", "de", "fr-CA"];
const matched = matchLanguage("de-AT-Vienna", supported, "en");
console.log(matched); // "de"
```

### 3. Next.js App Router & Full-Stack Routing Middleware

Zero-boilerplate Web Standard middleware supporting prefix routing strategies and automatic cookie persistence:

```typescript
// middleware.ts (Next.js App Router)
import { createI18nMiddleware } from "locl-js/detector";

export const middleware = createI18nMiddleware({
  locales: ["en", "de", "fr"],
  defaultLocale: "en",
  prefixStrategy: "as-needed", // "as-needed" (default) | "always" | "never"
  cookieName: "NEXT_LOCALE",
  ignore: ["/api", "/_next", "/favicon.ico"]
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
```

#### Routing Strategies

- **`"as-needed"`** *(Default)*: Default language is served at root (`/about`), secondary languages are prefixed (`/de/about`). Visiting `/en/about` redirects to `/about`.
- **`"always"`**: All languages require prefixes (`/en/about`, `/de/about`). Visiting `/about` redirects to `/{detectedLocale}/about`.
- **`"never"`**: No path prefixes. Locale is resolved purely from cookies, query parameters, or `Accept-Language` headers.

### 4. SEO Alternate Hreflang Links

Generate search engine optimization `hreflang` link headers or metadata tags:

```typescript
import { getHreflangLinks } from "locl-js/detector";

const links = getHreflangLinks("https://example.com", "/about", ["en", "de", "es"], "en");
// [
//   { rel: "alternate", hreflang: "en", href: "https://example.com/about" },
//   { rel: "alternate", hreflang: "de", href: "https://example.com/de/about" },
//   { rel: "alternate", hreflang: "es", href: "https://example.com/es/about" },
//   { rel: "alternate", hreflang: "x-default", href: "https://example.com/about" }
// ]
```

---

## Native Ordinal Pluralization (`1st`, `2nd`, `3rd`, `4th`)

LocL supports ordinal plural rules out of the box using native `Intl.PluralRules({ type: "ordinal" })`.

### 1. Dual-Mode Plural Objects

Define standard cardinal plurals alongside nested `ordinal` definitions within the same key:

```typescript
const en = {
  competition: {
    one: "1 competitor",
    other: "{count} competitors",
    ordinal: {
      "=1": "1st place champion!",
      one: "{count}st place",
      two: "{count}nd place",
      few: "{count}rd place",
      other: "{count}th place"
    }
  }
};

// Cardinal plurals via plural() or t()
translator.plural("competition", { count: 1 }); // "1 competitor"
translator.plural("competition", { count: 5 }); // "5 competitors"

// Ordinal plurals via ordinal()
translator.ordinal("competition", { count: 1 });  // "1st place champion!"
translator.ordinal("competition", { count: 2 });  // "2nd place"
translator.ordinal("competition", { count: 3 });  // "3rd place"
translator.ordinal("competition", { count: 4 });  // "4th place"
translator.ordinal("competition", { count: 21 }); // "21st place"
```

### 2. Suffix Ordinals

Define ordinals using `_ordinal_*` suffixes:

```typescript
const en = {
  winner_ordinal_one: "{count}st winner",
  winner_ordinal_two: "{count}nd winner",
  winner_ordinal_few: "{count}rd winner",
  winner_ordinal_other: "{count}th winner",
  "winner_ordinal_=1": "Grand Champion"
};

translator.ordinal("winner", { count: 1 }); // "Grand Champion"
translator.ordinal("winner", { count: 2 }); // "2nd winner"
```

---

## Language-Aware Unicode CLDR Plural Validation (`LangWithPlurals<T, L>`)

Unlike libraries that force every language into a generic `one` / `other` schema, `LangWithPlurals<T, Language>` verifies secondary language files against the exact Unicode CLDR rules for that language:

```typescript
import type { LangWithPlurals } from "locl-js";

interface BaseSchema {
  messages: {
    one: string;
    other: string;
  };
  car_one: string;
  car_other: string;
}

// ✅ Japanese ("ja") has no grammatical plural: ONLY requires 'other'!
const ja: LangWithPlurals<BaseSchema, "ja"> = {
  messages: { other: "メッセージ{count}件" }, // 'one' is NOT required!
  car_other: "車{count}台"
};

// ✅ Russian ("ru") requires Slavic plural forms: 'one', 'few', 'many', 'other'
const ru: LangWithPlurals<BaseSchema, "ru"> = {
  messages: {
    one: "{count} сообщение",
    few: "{count} сообщения",
    many: "{count} сообщений",
    other: "{count} сообщений"
  },
  car_one: "{count} машина",
  car_few: "{count} машины",
  car_many: "{count} машин",
  car_other: "{count} машин"
};
```

---

## Strict Parameter Type-Checking

When defining resources with `defineResources` (or `as const`), `LocL` automatically extracts template tokens and enforces parameter types:

```typescript
import { defineResources, initLocL } from "locl-js";

const resources = defineResources({
  en: {
    welcome: "Welcome back, {name}!",
    notification: "Hello {{user}}, you have {count} items.",
    staticNotice: "Server maintenance scheduled for tonight.",
  },
});

const translator = initLocL({ resources, fallbackLanguage: "en" });

// ✅ TypeScript validates parameters and provides IDE autocomplete:
translator.t("welcome", { name: "Alice" });
translator.t("notification", { user: "Bob", count: 3 });

// ❌ TypeScript errors on missing or invalid parameters:
// translator.t("welcome"); // Error: Expected 2 arguments, got 1
// translator.t("welcome", { wrongKey: "Alice" }); // Error: Property 'name' is missing

// ✅ Static templates allow omitting options:
translator.t("staticNotice");
```

Compile-Time Translation Parity (`defineStrictResources`)
Prevent missing translations from reaching production. `defineStrictResources` enforces at compile time that **every secondary language implements all keys present in the fallback language**

---

## Safe Type Mode for Huge Dictionaries

When translation files grow past 10,000+ keys, recursive template-literal parsing (`ExtractInterpolationParams`) can slow down TypeScript compilation (`tsc`).

Set `strictParams: false` to disable template parsing while **retaining 100% key autocompletion and path validation**:

```typescript
import { initLocL, defineResources } from "locl-js";

const resources = defineResources({
  en: {
    welcome: "Welcome, {name}!",
    dashboard: {
      profile: "User profile",
      settings: "Account settings"
    }
  }
});

const translator = initLocL({
  resources,
  fallbackLanguage: "en",
  strictParams: false // ⚡ Maximizes tsc performance for huge dictionaries
});

// ✅ Keys are STILL strictly autocompleted and validated:
translator.t("dashboard.profile");
translator.t("welcome", { name: "Alice" });

// ❌ Typos are STILL caught at compile time:
// translator.t("dashboard.nonExistent"); // Error: Key does not exist
```

### Pre-Flattened & Unflattening Utilities

Flatten nested dictionaries at type level and runtime for build-time optimizations, and reconstruct them when needed:

```typescript
import { flattenDictionary, unflattenDictionary, type FlattenKeys, type PreFlattened } from "locl-js";

// Type-level dot notation union
type Keys = FlattenKeys<typeof resources.en>;
// "welcome" | "dashboard" | "dashboard.profile" | "dashboard.settings"

// Runtime dictionary flattener (preserves plural objects like { one, other })
const flat = flattenDictionary(resources.en);
// {
//   "welcome": "Welcome, {name}!",
//   "dashboard.profile": "User profile",
//   "dashboard.settings": "Account settings"
// }
// Reconstruct nested structure from flat keys safely
const nested = unflattenDictionary(flat);
```

---

## React Integration (`locl-js/react`)

`LocL` provides concurrent-safe React bindings powered by `useSyncExternalStore` and an XSS-safe `<Trans />` component. You can choose between two type-safe workflows:

### Workflow A: Zero-Declaration Factory (`createLocLReact`) ⭐ *Recommended*

No `.d.ts` declaration merging required. Pass your translator instance to `createLocLReact` once and export pre-bound, 100% typed components and hooks:

```tsx
// src/i18n-react.ts
import { initLocL, defineResources } from "locl-js";
import { createLocLReact } from "locl-js/react";

export const translator = initLocL({
  resources: defineResources({
    en: {
      welcome: "Welcome, {name}!",
      user: { title: "Profile", greeting: "Hello, {name}!" },
    },
  }),
  fallbackLanguage: "en",
});

export const {
  LocLProvider,
  useTranslation,
  useLocL,
  Trans,
  Hydrate,
  Link,
  useLocalizedPath
} = createLocLReact(translator);
```

In your application components:

```tsx
import React from "react";
import { LocLProvider, useTranslation, Trans } from "./i18n-react";

export function App() {
  return (
    <LocLProvider>
      <Header />
      <Profile />
    </LocLProvider>
  );
}

function Header() {
  const { t, language, changeLanguage, direction, ordinal } = useTranslation();

  return (
    <header dir={direction}>
      <h1>{t("welcome", { name: "Alice" })}</h1>
      <button onClick={() => changeLanguage("de")}>Deutsch ({language})</button>
    </header>
  );
}

function Profile() {
  // Scoped autocomplete: keys are restricted strictly to the "user" namespace!
  const { t } = useTranslation("user");

  return (
    <section>
      <h2>{t("title")}</h2>
      <Trans
        scope="user"
        i18nKey="greeting"
        values={{ name: "Alice" }}
        components={{ bold: <strong className="font-bold" /> }}
      />
    </section>
  );
}
```

---

### Workflow B: Global Type Registry (`LocLRegister`)

If you prefer importing hooks and components directly from `"locl-js/react"`, augment `LocLRegister` once in your project (e.g. `src/i18n.d.ts`):

```typescript
import { translator } from "./i18n";

declare module "locl-js/react" {
  interface LocLRegister {
    translator: typeof translator;
  }
}
```

Standalone imports automatically have full autocomplete everywhere without passing any generic arguments:

```tsx
import { useTranslation, Trans } from "locl-js/react";

function UserProfile() {
  const { t } = useTranslation("user"); // ✅ Scopes and keys autocompleted globally!
  return <h1>{t("title")}</h1>;
}
```

---

### The `<Trans />` Component

Renders translations containing formatting tags (`<bold>read</bold>`, `<link href="/terms">terms</link>`) and self-closing elements (`<br />`) into React elements safely without `dangerouslySetInnerHTML`:

```tsx
<Trans
  i18nKey="notice" // "Please <bold>read</bold> our <link href="/terms">terms</link>.<br />Thank you!"
  values={{ name: "Alice" }}
  components={{
    bold: <strong className="text-primary font-bold" />,
    link: <a href="/terms" className="underline" target="_blank" rel="noopener noreferrer" />,
    br: <br />,
  }}
  fallback="Please read our terms."
/>
```

#### Key Capabilities

- **Strict Key Validation**: Autocompletes valid keys and flags typos at compile time.
- **Strict Value Validation**: If the template contains `{name}`, `values={{ name: ... }}` is required at compile time.
- **Tag Attributes Supported**: Tag markers can include arbitrary attributes (e.g., `<link href="/path">text</link>`).
- **Nested & Self-Closing Tags**: Supports self-closing tags (`<br />`, `<hr />`) and recursively parses nested elements (`<bold>Click <link>here</link></bold>`).
- **Dynamic Key Fallback**: Dynamic keys are permitted whenever an explicit `fallback` prop is provided (`fallback="Default string"`).
- **Scope Support**: Narrow keys using the `scope` prop: `<Trans scope="user" i18nKey="greeting" values={{ name: "Alice" }} />`.
- **Standalone `translator` Prop**: Automatically infers dictionaries from custom translator instances passed via `translator={translator}`.
- **Tag Element Replacement**: Clones JSX elements while preserving inner content as children.
- **Function Renderers**: Supports custom render functions: `(content) => <span className="font-bold">{content}</span>`.
- **Store-Versioned Reactive Updates**: Subscribes to `useSyncExternalStore` and internal store revisions so language and bundle updates trigger seamless re-renders.

---

### Localized Links & Routing (`<Link />` & `useLocalizedPath`)

LocL provides localization-aware navigation utilities that automatically rewrite URLs to adhere to your routing prefix strategy (`"as-needed"`, `"always"`, or `"never"`):

```tsx
import { Link, useLocalizedPath } from "./i18n-react";

export function Navigation() {
  const getPath = useLocalizedPath(); // Respects active language and prefix strategy

  return (
    <nav>
      {/* Rewrites to "/about" (if en is default) or "/de/about" (if de is active) */}
      <Link href="/about">About Us</Link>

      {/* Explicit locale override: links directly to "/es/pricing" */}
      <Link href="/pricing" locale="es">Precios</Link>

      {/* Prefix strategy override: forces prefix even on default locale ("/en/contact") */}
      <Link href="/contact" prefixStrategy="always">Contact</Link>

      {/* Programmatic path resolution */}
      <button onClick={() => window.location.href = getPath("/dashboard")}>
        Dashboard
      </button>
    </nav>
  );
}
```

---

### SSR Hydration & Zero-Flicker Bootstrapping (`<LocLHydrate />`)

When server-rendering (SSR) applications, `<LocLHydrate />` embeds the server's serialized translation payload (`__LOCL_DATA__`) and populates the client-side translator before component rendering. This prevents UI flashes of untranslated keys and eliminates hydration mismatches:

```tsx
// src/components/ClientRoot.tsx ("use client")
import React from "react";
import { LocLProvider, LocLHydrate } from "locl-js/react";
import { translator } from "@/i18n";

export function ClientRoot({ state, children }: { state: any; children: React.ReactNode }) {
  return (
    <LocLProvider translator={translator}>
      <LocLHydrate state={state}>
        {children}
      </LocLHydrate>
    </LocLProvider>
  );
}
```

---

## Lazy Loading & React `<Suspense>`

Load translations dynamically on demand using bundler dynamic `import()` or browser `fetch()`. Supports both **monolithic bundles** (`de.json`) and **modular namespaces** (`de/dashboard.json`):

### 1. Configuring the Loader

```typescript
import { initLocL } from "locl-js";

const translator = initLocL({
  resources: { en: {} },
  fallbackLanguage: "en",
  // Universal loader: supports JSON, TS/JS modules, default/named exports, or fetch() Responses
  loader: (lang, ns) => ns 
    ? import(`./locales/${lang}/${ns}.json`) // Modular namespace file
    : import(`./locales/${lang}.json`)       // Full language file
});

// Imperative loading:
await translator.loadLanguage("de");
await translator.loadNamespace("dashboard");
```

### 2. React `<Suspense>` Mode

Pass `{ suspense: true }` to `useTranslation()` to suspend component rendering until the bundle arrives:

```tsx
import React, { Suspense } from "react";
import { useTranslation, LocLProvider } from "locl-js/react";

function Dashboard() {
  // Suspends component rendering until 'en/dashboard.json' finishes loading!
  const { t } = useTranslation("dashboard", { suspense: true });
  return <h1>{t("title")}</h1>;
}

export function App() {
  return (
    <LocLProvider translator={translator}>
      <Suspense fallback={<div>Loading translations...</div>}>
        <Dashboard />
      </Suspense>
    </LocLProvider>
  );
}
```

### 3. Non-Suspense Background Loading (`ready`)

For non-suspense setups, inspect the reactive `ready: boolean` flag:

```tsx
function Profile() {
  const { t, ready } = useTranslation("profile");

  if (!ready) {
    return <div>Loading profile translations...</div>;
  }

  return <h1>{t("heading")}</h1>;
}
```

### 4. Over-The-Air (OTA) Remote Loader (`createRemoteLoader`)

Deliver continuous translation updates from a CDN or translation management system without deploying new application releases. `createRemoteLoader` implements a battle-tested **Stale-While-Revalidate (SWR)** caching strategy:

- **Instant Boot**: Immediately loads translations from client storage cache (`localStorage`, `sessionStorage`, or `memory`).
- **Background Refresh**: Silently fetches updated dictionaries in the background when cached entries exceed `maxAge`.
- **Offline Resilience**: Automatically falls back to stale cached dictionaries if network requests fail.

```typescript
import { initLocL, createRemoteLoader } from "locl-js";

// Bundled fallback for instant first render
import enFallback from "./locales/en.json";

const loader = createRemoteLoader({
  // URL template supporting {lang} and {ns} placeholders, or a custom resolver function
  endpoint: "https://cdn.example.com/locales/{lang}/{ns}.json",

  // Cache storage: "localStorage" (default in browser), "sessionStorage", "memory", or custom
  storage: "localStorage",

  // Cache TTL: 24 hours (default: 86,400,000 ms)
  maxAge: 1000 * 60 * 60 * 24,

  // Return cached content immediately while refreshing in background (default: true)
  staleWhileRevalidate: true,

  // Optional headers or authentication tokens
  headers: () => ({
    Authorization: `Bearer ${getAuthToken()}`
  }),

  onSuccess: (lang, ns, data) => {
    console.log(`[OTA] Updated translations for ${lang} (${ns ?? "root"})`);
  },
  onError: (err, lang, ns) => {
    console.warn(`[OTA] Failed to fetch translations for ${lang}:`, err.message);
  }
});

export const translator = initLocL({
  resources: { en: enFallback },
  fallbackLanguage: "en",
  loader
});

// Clear cache when user logs out or switches tenant
await loader.clearCache();
```

#### `RemoteLoaderOptions` Configuration

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `endpoint` | `string \| ((lang, ns?) => string)` | *Required* | Remote URL template (`{lang}`, `{ns}`) or resolver function. |
| `storage` | `"localStorage" \| "sessionStorage" \| "memory" \| RemoteLoaderStorage` | `"localStorage"` | Storage layer used to persist cached translations. |
| `maxAge` | `number` | `86400000` (24h) | Time in milliseconds before a cached entry is considered stale. |
| `staleWhileRevalidate` | `boolean` | `true` | Returns stale cache instantly while fetching updates in the background. |
| `storagePrefix` | `string` | `"locl_ota_"` | Prefix prepended to cache storage keys. |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Custom fetch polyfill or fetch wrapper. |
| `headers` | `Record<string, string> \| (() => ...)` | `undefined` | Custom HTTP request headers or async resolver. |
| `onSuccess` | `(lang, ns, data) => void` | `undefined` | Callback fired when fresh translations arrive. |
| `onError` | `(err, lang, ns) => void` | `undefined` | Callback fired when remote fetch encounters an error. |

---

## Drop-in `i18next` Compatibility (`locl-js/compat`)

Migrate existing `i18next` codebases effortlessly without rewriting callsites:

```typescript
import { initLocL, defineResources } from "locl-js";
import { toI18next } from "locl-js/compat";

const resources = defineResources({
  en: {
    common: {
      hello: "Hello, {name}!",
      save: "Save"
    },
    apple_one: "1 apple",
    apple_other: "{count} apples",
    rank_ordinal_one: "{count}st",
    rank_ordinal_other: "{count}th"
  }
});
const locl = initLocL({ resources, fallbackLanguage: "en" });
export const i18n = toI18next(locl);

// Colon and dot syntax autocompleted and strictly enforced:
i18n.t("common:hello", { name: "Maria" }); // Requires { name }!
i18n.t("common.save");                    // Static key: options optional!

// Plurals strictly enforce { count: number }:
i18n.t("apple", { count: 5 });

// Native ordinals:
i18n.ordinal("rank", { count: 1 }); // "1st"

// Dynamic and fallback keys:
i18n.t("missing.key", "Default Fallback");
i18n.t("missing.key", { defaultValue: "Fallback Text" });

// Key existence check (with autocomplete for colon and dot keys):
i18n.exists("common:save"); // true

// Resource bundle management:
i18n.addResourceBundle("en", "dynamic", { title: "Title" });
i18n.hasResourceBundle("en", "dynamic"); // true
i18n.getResourceBundle("en", "dynamic"); // { title: "Title" }

// Asynchronous namespace loading:
await i18n.loadNamespaces(["auth", "checkout"]);

// Event listeners with cleanup callback:
const unbind = i18n.on("languageChanged", (lng) => {
  console.log("Language changed to", lng);
});
unbind(); // Unsubscribes listener

// Dynamic language switch with automatic missing-language preloading:
await i18n.changeLanguage("es");
```

---

## Server Components & Full-Stack (`locl-js/server`)

`LocL` provides headless request isolation using Node's native `AsyncLocalStorage`. Designed specifically for **React Server Components (RSC)**, **Next.js App Router**, **Remix**, and **Astro**, you get strictly typed translations on the server without client-side React Context or `"use client"` directives.

### 1. Set Up Server Suite (`src/i18n-server.ts`)

```typescript
import { initLocL, defineResources } from "locl-js";
import { createLocLServer } from "locl-js/server";

export const translator = initLocL({
  resources: defineResources({
    en: {
      title: "Dashboard",
      welcome: "Welcome back, {name}!",
      analytics: { views: "{count} views" }
    },
    de: {
      title: "Übersicht",
      welcome: "Willkommen zurück, {name}!",
      analytics: { views: "{count} Aufrufe" }
    }
  }),
  fallbackLanguage: "en"
});

export const {
  getTranslator,
  getTranslations,
  getSyncTranslator,
  runWithLocale,
  runWithTranslator,
  getLocale,
  setLocale
} = createLocLServer(translator);
```

### 2. Use in React Server Components (Next.js App Router)

```tsx
// app/[locale]/page.tsx (Server Component — no "use client"!)
import { getTranslator } from "@/i18n-server";

export default async function Page() {
  const t = await getTranslator();

  return (
    <main>
      <h1>{t("title")}</h1>
      <p>{t("welcome", { name: "Alice" })}</p>
    </main>
  );
}
```

### 3. Scoped Translations on the Server

```tsx
// app/[locale]/analytics/page.tsx
import { getTranslator } from "@/i18n-server";

export default async function AnalyticsPage() {
  // Scopes are autocompleted and restrict keys to the "analytics" namespace!
  const t = await getTranslator("analytics");

  return <div>{t("views", { count: 1200 })}</div>;
}
```

### 4. Middleware & Request Isolation

Wrap incoming requests or layouts in `runWithLocale()` to automatically bind the active language to the asynchronous execution tree:

```typescript
// middleware.ts or Express/Fastify request handler
import { runWithLocale } from "@/i18n-server";

export async function handleRequest(request: Request, next: () => Promise<Response>) {
  const locale = request.headers.get("x-locale") || "en";

  return runWithLocale(locale, () => {
    return next(); // Any downstream server components will automatically use `locale`!
  });
}
```

#### Capabilities of `ServerTranslator`

The returned `t` from `await getTranslator()` is both a callable function and an object with attached utilities:

```typescript
const t = await getTranslator();

// Callable function:
t("title");
t("welcome", { name: "Alice" });

// Attached utilities:
t.plural("cart", { count: 3 });
t.ordinal("rank", { count: 1 });
t.language;       // "en"
t.direction;      // "ltr"
t.isRTL();        // false
t.getMetadata();  // { language: "en", direction: "ltr", isRTL: false }
t.format("100", "currency", ["USD"]);
t.translator;     // Access to underlying LocL instance
```

### 5. Server State Dehydration for Client Hydration (`dehydrate`)

When building isomorphic applications (e.g. Next.js App Router with mixed Server and Client components), serialize server translator state using `dehydrate()` and pass it to client `<LocLHydrate />`:

```tsx
// app/[locale]/layout.tsx (Server Component Layout)
import { getTranslator, dehydrate } from "@/i18n-server";
import { ClientRoot } from "@/components/ClientRoot";

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = await getTranslator();
  const dehydratedState = dehydrate(t); // { locale: "de", resources: { de: { ... } }, direction: "ltr" }

  return (
    <html lang={dehydratedState.locale} dir={dehydratedState.direction}>
      <body>
        {/* Pass dehydrated server state to client components */}
        <ClientRoot state={dehydratedState}>
          {children}
        </ClientRoot>
      </body>
    </html>
  );
}
```

`dehydrate()` accepts a `LocL` translator instance, a `ServerTranslator` callable (`t`), a server suite, or automatically resolves from the default server instance.

---

## Pluralization (Categories & Exact Values)

`LocL` supports pluralization directly inside `translator.t()` and through `translator.plural()`. Both approaches automatically evaluate exact quantity rules (`=0`, `=1`, `=N`) and standard CLDR categories (`zero`, `one`, `two`, `few`, `many`, `other`).

### Object Pluralization with Exact Quantities

Exact numeric keys take priority over grammatical categories:

```typescript
const en = {
  messages: {
    "=0": "You have no unread messages.",
    "=1": "You have exactly one message.",
    one: "You have 1 message.",
    other: "You have {count} messages.",
  },
};

translator.t("messages", { count: 0 }); // "You have no unread messages."
translator.t("messages", { count: 1 }); // "You have exactly one message."
translator.t("messages", { count: 5 }); // "You have 5 messages."
```

### Suffix Pluralization

Define forms using category and exact value suffixes:

```typescript
const en = {
  "item_=0": "No items remaining.",
  item_one: "1 item remaining.",
  item_other: "{count} items remaining.",
};

translator.t("item", { count: 0 }); // "No items remaining."
translator.t("item", { count: 1 }); // "1 item remaining."
translator.t("item", { count: 4 }); // "4 items remaining."
```

### ICU Inline Plural Syntax & Offsets

Define plurals directly inline inside string templates using standard ICU MessageFormat plural syntax. LocL compiles inline plurals into optimized chunks at runtime with zero overhead:

```typescript
const en = {
  cart: "{count, plural, =0 {Your cart is empty} =1 {You have 1 item} other {You have # items}}",
  liked: "{count, plural, offset:1 =0 {Nobody liked this} =1 {You liked this} one {You and # other person} other {You and # other people}}",
  upload: "{count, plural, one {{user} uploaded # file} other {{user} uploaded # files}}"
};

// Exact and category matching with native '#' number formatting
translator.t("cart", { count: 0 });  // "Your cart is empty"
translator.t("cart", { count: 1 });  // "You have 1 item"
translator.t("cart", { count: 1250 }); // "You have 1,250 items" (formatted via Intl.NumberFormat)

// Offsets: subtracts offset before plural rule selection and '#' substitution
translator.t("liked", { count: 0 }); // "Nobody liked this"
translator.t("liked", { count: 1 }); // "You liked this"
translator.t("liked", { count: 2 }); // "You and 1 other person" (2 - 1 = 1 -> 'one')
translator.t("liked", { count: 6 }); // "You and 5 other people" (6 - 1 = 5 -> 'other')

// Nested template variables ({user} AND {count}) are strictly typed!
translator.t("upload", { user: "Alice", count: 3 }); // "Alice uploaded 3 files"
```

#### Key Capabilities of Inline Plurals

- **`#` Number Formatting**: Replaced with the localized number formatted via `Intl.NumberFormat` for the active language. Literal `#` can be escaped as `\#`.
- **`offset:N` Support**: Adjusts the count for category selection and `#` substitution (ideal for "You and N others" patterns).
- **Nested Placeholders**: Embed variables and formatters (`{name | upper}`) inside any branch.
- **Strict Compile-Time Safety**: Automatically infers `{ count: number }` plus any nested variables in TypeScript.

> **Note**: Both single `{var}` and double `{{var}}` placeholders are supported across all templates.

---

## RTL Language Utilities

LocL automatically detects script direction using `Intl.Locale`, BCP 47 script subtags (`az-Arab` vs `az-Latn`), and comprehensive ISO 639 language fallbacks:

```typescript
const translator = initLocL({
  resources: {
    en: { title: "Dashboard" },
    ar: { title: "لوحة التحكم" }
  },
  fallbackLanguage: "en"
});

console.log(translator.getDirection()); // "ltr"
console.log(translator.isRTL());        // false

// When running in a browser, document.documentElement (`<html dir="..." lang="...">`)
// is automatically synced upon initialization and language switches!
translator.changeLanguage("ar");

console.log(translator.getDirection()); // "rtl"
console.log(translator.isRTL());        // true
console.log(translator.getMetadata());  // { language: "ar", direction: "rtl", isRTL: true }
```

In React components via `useTranslation()` or `useLocL()`:

```tsx
function Header() {
  const { t, direction, isRTL } = useTranslation();

  return (
    <header style={{ textAlign: isRTL() ? "right" : "left" }}>
      <h1>{t("title")}</h1>
      <span>Current direction: {direction}</span>
    </header>
  );
}
```

---

## ICU Select Branching

Support gender or contextual choice branching with ICU `select` syntax, including **nested placeholders** inside branch bodies:

```typescript
const en = {
  feedback: "{gender, select, male {He liked your photo} female {She liked your photo} other {They liked your photo}}.",
  items: "{gender, select, male {He has {count} items} female {She has {count} items} other {They have {count} items}}",
};

translator.t("feedback", { gender: "female" }); 
// "She liked your photo."

// Nested parameters (gender AND count) are strictly typed!
translator.t("items", { gender: "male", count: 42 }); 
// "He has 42 items"
```

---

## Built-in & Custom Formatters

Use pipe syntax (`{variable | formatter[:args]}`) inside your translations:

```typescript
const en = {
  profile: "Member since {joined | date:short}. Balance: {balance | currency:USD}.",
  user: "Username: {name | trim | upper | truncate:12, ...}",
  dateRange: "Expires: {date | date:short}"
};
```

### Multi-Pipe Formatter Chaining

Chain multiple formatters sequentially from left to right using pipe (`|`) operators:

```typescript
const en = {
  user: "User: {name | trim | upper | truncate:8, ...}",
};

// Input: "   alexander   "
// Step 1: trim     -> "alexander"
// Step 2: upper    -> "ALEXANDER"
// Step 3: truncate -> "ALEXA..."
translator.t("user", { name: "   alexander   " }); 
// "Username: ALEXA..."
```

### Built-in Formatters

| Formatter | Description | Example |
| :--- | :--- | :--- |
| `upper` | Uppercase string | `{name \| upper}` |
| `lower` | Lowercase string | `{name \| lower}` |
| `capitalize` | Capitalize first letter | `{name \| capitalize}` |
| `trim` | Strip leading/trailing whitespace | `{name \| trim}` |
| `truncate` | Truncate string with suffix | `{text \| truncate:10, ...}` |
| `number` | `Intl.NumberFormat` decimal | `{val \| number:en-US}` |
| `currency` | `Intl.NumberFormat` currency | `{val \| currency:EUR, de-DE}` |
| `date` | `Intl.DateTimeFormat` date | `{val \| date:en-US, short}` |
| `relativeDate` | Formats relative time | `{val \| relativeDate:en-US}` |
| `json` | Converts object to JSON string | `{data \| json}` |
| `yesNo` | Returns "Yes" / "No" or custom labels | `{flag \| yesNo:Y, N}` |
| `boolean` | Returns "true" / "false" or custom labels | `{flag \| boolean:Active, Inactive}` |
| `padStart` | Left pad string | `{code \| padStart:5, 0}` |
| `padEnd` | Right pad string | `{code \| padEnd:5, _}` |
| `list` | Formats arrays using native `Intl.ListFormat` | `{users \| list}`, `{users \| list:de,disjunction}` |
| `languageName` | Localized language display name via `Intl.DisplayNames` | `{lang \| languageName:en}` ("German") |
| `regionName` | Localized country/region display name via `Intl.DisplayNames` | `{country \| regionName:en}` ("United States") |
| `currencyName` | Localized currency display name via `Intl.DisplayNames` | `{curr \| currencyName:en}` ("US Dollar") |
| `displayName` | Generalized display name resolver via `Intl.DisplayNames` | `{code \| displayName:language,en}` |

### Custom Formatters

Add custom formatters during initialization:

```typescript
const translator = initLocL({
  resources,
  fallbackLanguage: "en",
  formatters: {
    reverse: (val) => String(val).split("").reverse().join(""),
    highlight: (val) => `***${val}***`,
  },
});

translator.t("greeting", { name: "Alice" }, { formatter: "highlight" });
```

---

## Multi-Framework Reactive Store (Svelte, Vue, Solid, Node.js)

`LocL` implements the standard reactive store contract (`subscribe`):

```typescript
const unsubscribe = translator.subscribe((newLang, prevLang, meta) => {
  console.log(`Language updated to ${newLang} (Direction: ${meta.direction})`);
});

translator.changeLanguage("es");
unsubscribe();
```

- **Svelte**: Reference directly as an auto-subscribing readable store (`$t("key")`) via `locl-js/svelte`.
- **Vue**: Bind to reactive refs via `locl-js/vue`.
- **Solid**: Integrate with `createSignal` inside `translator.subscribe()`.
- **Node.js**: Cleanly isolate translations per request or per session.

### Svelte Store Integration (`locl-js/svelte`)

`createLocLSvelte` wraps any `LocL` instance into a native Svelte readable store implementing the Svelte store contract. Compatible with both **Svelte 4** and **Svelte 5**:

```svelte
<!-- src/App.svelte -->
<script lang="ts">
  import { createLocLSvelte } from "locl-js/svelte";
  import { translator } from "./i18n";

  // Creates an auto-subscribing readable store
  const t = createLocLSvelte(translator);
</script>

<!-- Use $t prefix for reactive updates on language change -->
<main>
  <h1>{$t("welcome", { name: "Svelte" })}</h1>
  <button on:click={() => translator.changeLanguage("de")}>Deutsch</button>
</main>
```

### Vue 3 Composable Integration (`locl-js/vue`)

`createLocLVue` provides seamless Vue 3 Composition API bindings. Pass Vue's `shallowRef` to integrate directly into Vue's reactivity graph:

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { shallowRef } from "vue";
import { createLocLVue } from "locl-js/vue";
import { translator } from "./i18n";

// Integrates directly with Vue's reactivity system
const { t, language } = createLocLVue(translator, shallowRef);
</script>

<template>
  <main>
    <h1>{{ t("welcome", { name: "Vue" }) }}</h1>
    <p>Active Locale: {{ language }}</p>
    <button @click="translator.changeLanguage('es')">Español</button>
  </main>
</template>
```

### Vite Plugin & Hot Module Replacement (`locl-js/vite`)

Enable instantaneous Hot Module Replacement (HMR) for translation dictionaries during development. When you edit any `.json` file in your `locales/` directory, updates are pushed via WebSocket and merged live without a full page reload:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { loclVitePlugin } from "locl-js/vite";

export default defineConfig({
  plugins: [
    loclVitePlugin({ localesDir: "locales" })
  ]
});
```

Connect the client-side translator to Vite's HMR bus:

```typescript
// src/i18n.ts
import { initLocL } from "locl-js";
import { setupLocLHmr } from "locl-js/vite";

export const translator = initLocL({
  resources: { /* initial translations */ },
  fallbackLanguage: "en"
});

// Automatically hot-reloads translations in development
if (import.meta.hot) {
  setupLocLHmr(translator, import.meta.hot);
}
```

---

## Rich Tag Interpolation (`translator.rich`)

Interpolate custom inline components, terminal styling, or HTML strings using `<tag>content</tag>` in vanilla and non-React environments:

```typescript
const en = {
  notice: "Click <link href=\"/details\">here</link> to view details or <bold>read more</bold>.",
};

const elements = translator.rich("notice", {
  link: (text) => `<a href="/details">${text}</a>`,
  bold: (text) => `<b>${text}</b>`,
});

console.log(elements.join(""));
// "Click <a href="/details">here</a> to view details or <b>read more</b>."
```

---

## Built-in Pseudo-Localization (Enterprise QA Mode)

Catch unlocalized strings and layout overflow issues during enterprise QA testing:

```typescript
const translator = initLocL({
  resources,
  fallbackLanguage: "en",
  pseudoLocalization: true // Replaces text: "[!!! Ḩéļļö Ŵöŕļđ !!!]"
});

// Or configure and toggle at runtime:
translator.setPseudoLocalization({
  enabled: true,
  prefix: "« ",
  suffix: " »",
  accents: true
});
```

* Preserves all HTML/JSX tags (`<bold>`, `<link>`) and interpolation tokens (`{name}`, `{{name}}`) completely intact.

---

## Production Telemetry Hook (`onMissingKey`)

Monitor untranslated keys and missing plural categories in production:

```typescript
const translator = initLocL({
  resources,
  fallbackLanguage: "en",
  onMissingKey: (key, language, fallbackChain) => {
    // Send to Datadog, Sentry, or internal telemetry
    console.warn(`[i18n telemetry] Missing key: ${key} in ${language} (Chain: ${fallbackChain.join(" -> ")})`);
  }
});
```

---

## BCP 47 Language Fallback Chains

LocL automatically negotiates regional language codes hierarchically:

$$\text{de-AT-Vienna} \longrightarrow \text{de-AT} \longrightarrow \text{de} \longrightarrow \text{en}$$

```typescript
const translator = initLocL({
  resources: {
    en: { greeting: "Hello", word: "Potato" },
    de: { greeting: "Hallo" },
    "de-AT": { word: "Erdapfel" }
  },
  fallbackLanguage: "en",
  language: "de-AT-Vienna"
});

// Found in regional de-AT
translator.t("word"); // "Erdapfel"

// Missing in de-AT, resolved from base "de"
translator.t("greeting"); // "Hallo"

// Inspect resolved fallback chain:
console.log(translator.getFallbackChain());
// ["de-AT-Vienna", "de-AT", "de", "en"]
```

---

## Dynamic Resources & Type Evolution

Add or deep-merge translation bundles at runtime safely with built-in prototype pollution guards. `addResources()` returns a type-evolved instance so new keys are immediately typed:

```typescript
// Add a single dotted key
translator.addResource("en", "dashboard.title", "Analytics Dashboard");

// Deep-merge an entire namespace (returns a type-evolved translator!)
const updatedTranslator = translator.addResources("en", {
  checkout: {
    pay: "Pay Now",
    cancel: "Cancel",
  },
});

// TypeScript autocompletes "checkout.pay"!
updatedTranslator.t("checkout.pay");
```

---

## Scopes & Proxies (`withConfig`)

Create lightweight, isolated translator instances for specific namespaces or fixed languages without duplicating resources:

```typescript
const resources = defineResources({
  en: {
    auth: { login: "Log In", register: "Sign Up" },
    dashboard: { welcome: "Welcome, {name}" },
  },
  de: {
    auth: { login: "Anmelden", register: "Registrieren" },
    dashboard: { welcome: "Willkommen, {name}" },
  },
});

const translator = initLocL({ resources, fallbackLanguage: "en" });

// Scoped proxy (inherits active language dynamically)
const authT = translator.withConfig({ scope: "auth" });
console.log(authT.t("login")); // "Log In"

// Fixed-language proxy (pinned to German regardless of global language)
const deDashboardT = translator.withConfig({ scope: "dashboard", language: "de" });
console.log(deDashboardT.t("welcome", { name: "Hans" })); // "Bienvenue, Hans"

// Combined array scopes (merges multiple namespaces)
const multiT = translator.withConfig({ scope: ["auth", "dashboard"] });
console.log(multiT.t("dashboard.welcome", { name: "Alice" })); // "Welcome, Alice"
```

---

## API Reference

### Top-Level Exports (`locl-js`)

- **`initLocL(config)`**: Creates and returns a new `LocL` translator instance. Supports `strictParams: false`, `onMissingKey`, and `pseudoLocalization`.
- **`createRemoteLoader(options)`**: Creates an Over-The-Air (OTA) translation loader with Stale-While-Revalidate caching and offline storage fallback.
- **`defineResources(resources)`**: Identity helper using `<const T>` to enforce compile-time literal types without `as const`.
- **`defineStrictResources(resources)`**: Identity helper enforcing compile-time translation parity across all secondary languages against the fallback language.
- **`defineFastResources(resources)`**: Identity helper for large dictionaries.
- **`flattenDictionary(obj)`**: Runtime utility flattening nested dictionary objects into single-level dot-notated objects while preserving plural objects.
- **`unflattenDictionary(flat)`**: Reconstructs a deeply nested dictionary from flat dot-notated keys.
- **`LangWithPlurals<T, Language>`**: Type utility enforcing language-aware CLDR plural structures per language code.

### Detector & Routing Exports (`locl-js/detector`)

- **`createI18nMiddleware(options)`** / **`handleI18nRouting(options)`**: Standard Web Response middleware for Next.js App Router, Astro, and edge runtimes.
- **`resolveRouteLocale(request, options)`**: Resolves routing prefixes, redirects, rewrites, and detected locales.
- **`getLocalizedPath(pathname, locale, defaultLocale, prefixStrategy?, locales?)`**: Helper generating localized URL paths based on prefix strategy.
- **`getHreflangLinks(baseUrl, pathname, locales, defaultLocale, strategy)`**: Generates SEO alternate `hreflang` links.
- **`detectBrowserLanguage(options)`**: Multi-source client-side locale detector.
- **`detectAndMatch(supported, fallback, options)`**: Detects and negotiates the closest supported locale.
- **`persistLanguage(language, options)`**: Stores active locale across cookies, storage, and HTML tags.
- **`attachDetector(translator, options)`**: Auto-detects locale and binds listener for auto-persistence.
- **`parseAcceptLanguage(header)`**: RFC 7231 `Accept-Language` parser returning sorted `{ lang, q }` objects.
- **`getAcceptedLanguages(header)`**: Returns ordered array of accepted language tags.
- **`matchLanguage(accepted, supported, fallback)`** / **`negotiateLanguage`**: BCP 47 matching heuristic engine.

### CLI Exports (`locl-js/cli`)

- **`extractKeys(options)`**: Scans codebases and extracts translation keys into JSON dictionaries.
- **`checkTranslations(options)`**: Verifies translation parity, parameter/tag matching (`lintParams: true`), missing keys, and extraneous keys in CI.
- **`translateTranslations(options)`**: Programmatically triggers automated AI and machine translation for missing keys (DeepL, OpenAI, Google, Ollama).
- **`maskTokens(text)`**: Shields variable tokens (`{name}`) and XML/JSX tags (`<bold>`) as `__LOCL_TOK_N__` before sending to translation APIs.
- **`unmaskTokens(text, tokens)`**: Restores shielded tokens into translated strings.
- **`translateBatchWithProvider(texts, from, to, options)`**: Low-level batch translation dispatcher across supported providers.
- **`getTranslationStatus(options)`**: Computes translation completion matrix and statistics.
- **`compileTranslations(options)`**: Compiles JSON dictionaries into TS, ESM, CJS, or JSON bundles.
- **`runCli(argv?)`**: Programmatic entrypoint for running the `locl` CLI.

### React Exports (`locl-js/react`)

- **`createLocLReact(translator)`**: Returns a pre-bound, zero-declaration React suite (`LocLProvider`, `useTranslation`, `useLocL`, `Trans`, `Hydrate`, `Link`, `useLocalizedPath`, `LocLContext`).
- **`LocLProvider`**: React Context Provider for managing the active translator.
- **`LocLHydrate`**: Client hydration component embedding server JSON data script and synchronizing client translator resources without UI layout shift.
- **`Link`**: Localization-aware anchor element automatically applying routing prefix strategies.
- **`useLocalizedPath(prefixStrategy?)`**: Hook returning a path generator function `(pathname, localeOverride?) => string`.
- **`useTranslation(scope?, options?, customTranslator?)`**: Translation hook with scope support, `<Suspense>` mode (`{ suspense: true }`), loader overrides, `ordinal()`, and `ready: boolean` status.
- **`useLocL(customTranslator?)`**: Hook returning translator instance, active language, and bound translator APIs.
- **`<Trans />`**: Rich JSX component interpolation supporting strict key/param validation, attributes in tags, paired/self-closing tags, nested elements, fallbacks, and scope narrowing.
- **`LocLRegister`**: Ambient interface for global type registration.

### Compat Exports (`locl-js/compat`)

- **`toI18next(translator)`**: Wraps a LocL instance into an `i18next`-compatible API with strict parameter checking.
- **`createI18nextCompat(translator)`**: Alias of `toI18next`.

### Server Exports (`locl-js/server`)

- **`createLocLServer(translator, options?)`**: Factory returning an isolated request suite (`getTranslator`, `getTranslations`, `getSyncTranslator`, `runWithLocale`, `runWithTranslator`, `getLocale`, `setLocale`).
- **`dehydrate(translatorOrSuite?)`**: Serializes server translator state, locale, resources, and direction into a `DehydratedLocLState` payload for client hydration.
- **`getTranslator(scope?, options?)`**: Asynchronous request-scoped translator resolver for Server Components.
- **`getTranslations(scope?, options?)`**: Alias of `getTranslator`.
- **`getSyncTranslator(scope?, options?)`**: Synchronous request-scoped translator resolver.
- **`runWithLocale(locale, fn)`**: Runs an asynchronous request tree with an isolated locale.
- **`runWithTranslator(translator, fn)`**: Runs an asynchronous request tree with an isolated translator.
- **`getLocale()`**: Returns the active locale from the current asynchronous request context.
- **`setLocale(locale)`**: Updates the active locale in the current asynchronous request context.
- **`setServerTranslator(translator)`**: Configures the global default server translator instance.
- **`getServerTranslator()`**: Returns the global default server translator instance.
- **`serverStorage`**: Direct access to the underlying `AsyncLocalStorage` instance.
- Re-exports `resolveRouteLocale`, `createI18nMiddleware`, `handleI18nRouting`, `getHreflangLinks`, `getLocalizedPath`.

### Svelte Exports (`locl-js/svelte`)

- **`createLocLSvelte(translator)`**: Wraps any `LocL` translator into a native Svelte readable store adhering to the Svelte store contract (`$t()`).

### Vue Exports (`locl-js/vue`)

- **`createLocLVue(translator, shallowRefFn?)`**: Wraps any `LocL` translator into a Vue 3 reactive composable exposing `{ t, language, translator }`.

### Vite Exports (`locl-js/vite`)

- **`loclVitePlugin(options?)`**: Vite development plugin detecting JSON dictionary updates and dispatching `locl:update` HMR WebSocket events.
- **`setupLocLHmr(translator, hot)`**: Client-side development helper binding Vite's `import.meta.hot` to hot-reload translations live without full page refresh.

### `LocL` Instance Methods

- **`t(key, values?, format?)`**: Translates a key, handles interpolation, formatters, and plurals.
- **`plural(key, values, format?)`**: Translates a key with pluralization.
- **`ordinal(key, values, format?)`**: Translates a key using native ordinal rules (`1st`, `2nd`...).
- **`rich(key, tagRenderers, values?)`**: Replaces `<tag>` and `<tag attr="...">` wrappers using custom renderer functions.
- **`getDirection(lang?)`**: Returns the script direction (`"ltr" | "rtl"`).
- **`isRTL(lang?)`**: Returns whether the active or queried locale is right-to-left.
- **`getMetadata(lang?)`**: Returns structured locale metadata (`{ language, direction, isRTL }`).
- **`changeLanguage(lang)`**: Updates current language, syncs document attributes, and notifies all subscribers.
- **`load(lang?, namespace?, loader?)`**: Asynchronously loads a monolithic language bundle or namespace.
- **`loadLanguage(lang, loader?)`**: Asynchronously loads an entire language bundle.
- **`loadNamespace(namespace, lang?, loader?)`**: Asynchronously loads a specific namespace.
- **`isLoaded(lang?, namespace?)`**: Checks if a language or namespace is currently loaded in memory.
- **`getFallbackChain(lang?)`**: Returns the BCP 47 hierarchical fallback chain for a locale.
- **`setPseudoLocalization(options)`**: Toggles or configures pseudo-localization mode at runtime.
- **`getVersion()`**: Returns the integer revision of the translator's state for external store syncing.
- **`getLanguage()`**: Returns the currently active language code.
- **`subscribe(listener)`**: Subscribes to language/resource changes. Returns an unsubscribe function.
- **`withConfig(config)`**: Returns a cached proxy translator instance with scoped configuration.
- **`clone(language?, scope?)`**: Clones the translator instance with optional language/scope overrides.
- **`addResource(lang, key, value)`**: Adds or overrides a single translation key at runtime.
- **`addResources(lang, bundle)`**: Deep-merges a dictionary into the target language, returning a type-evolved instance.
- **`format(value, formatterName, args?)`**: Executes a formatter function directly.
- **`get(key?)`**: Returns the raw translation value or the entire active scoped dictionary.
- **`getObj(key)`**: Returns a typed nested object from the translation tree.
- **`tt(key?, values?, format?)`**: Untyped translation alias.

---

## Contributing

Contributions, feedback, and pull requests are warmly welcomed! Please feel free to open an issue or submit a pull request on GitHub.

---

## License

This project is licensed under the [MIT License](LICENSE).