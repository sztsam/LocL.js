# LocL.js 🌐

[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/sztsam/LocL.js) [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://www.npmjs.com/package/locl-js)

**LocL** is an ultra-fast, lightweight, and fully-featured TypeScript internationalization (i18n) library. Designed for modern web applications, backend services, and multi-framework setups, it provides compile-time type safety, pre-compiled template execution, automatic pluralization with exact quantities, RTL script detection, built-in formatters with pipeline chaining, and reactive subscriptions with **zero external dependencies**.

It is inspired by libraries like `i18next` and `react-i18next`, but engineered with a focus on strict TypeScript type checking, sub-millisecond execution, clean APIs, and **100% test coverage across every statement, branch, and function**.

---

## Features ✨

- **🚀 10x–20x Execution Throughput**: Compiled token cache memoizes template execution plans on first lookup, eliminating regex scanning and string splitting in the hot path.
- **💪 Strict Compile-Time Safety**: Auto-extracts parameters (`{name}`, `{{name}}`, `{gender, select, ...}`) and enforces required arguments at compile time with full IDE autocomplete.
- **🏷️ `defineResources` & `defineStrictResources`**: Preserves literal types without `as const` and enforces complete translation parity across all secondary languages at compile time.
- **🔢 Plural Exact Quantities (`=0`, `=1`, `=N`)**: Define exact numeric exceptions alongside standard CLDR categories (`zero`, `one`, `other`) across both object and suffix plurals.
- **🧭 Built-in RTL & Direction Utilities**: Automatic script-direction detection (`translator.getDirection()`, `translator.isRTL()`) with automatic browser `<html dir="..." lang="...">` synchronization.
- **⚡ Lazy Loading & React `<Suspense>`**: Load monolithic language files (`de.json`) or modular namespaces (`de/dashboard.json`) asynchronously on demand with `<Suspense>` or non-suspense `ready` status.
- **⚛️ First-Class React Integration**: Official React bindings (`<LocLProvider>`, `useTranslation`, `useLocL`, `<Trans />`) via `locl-js/react` with concurrent-safe `useSyncExternalStore` and store versioning:
  - **`createLocLReact` Hook Factory**: Zero-declaration, pre-bound React suite.
  - **`LocLRegister` Declaration Merging**: Ambient global autocomplete for standalone imports.
- **📦 Zero Dependencies & Lightweight**: Pure TypeScript with no runtime dependencies.
- **🔄 Drop-in i18next Compat**: Swap existing `i18next` codebases effortlessly using `locl-js/compat` without rewriting call sites. Supports colon namespaces (`auth:login`), strict parameter checking, dynamic bundle preloading, `dir()`, and default fallbacks.
- **🌐 Multi-Framework Reactive Store**: Implements the standard reactive store contract via `translator.subscribe()`, working out of the box in Svelte, Vue, Solid, and Node.js.
- **🔀 ICU Select Support**: Conditional branching (`{gender, select, male {He} female {She} other {They}}`) with nested parameter interpolation (`{gender, select, male {He has {count} items}}`).
- **🔧 Multi-Pipe Formatter Chaining**: Format dates, numbers, currencies, strings, and booleans inline via pipe syntax (`{val | number}`, `{date | date:short}`). Chain multiple formatters sequentially (`{val | trim | upper | truncate:10}`).
- **🧪 Built-in Pseudo-Localization**: Enterprise QA mode to test layout expansion and unlocalized strings without third-party tooling, preserving tags and interpolation tokens.
- **🌍 BCP 47 Language Negotiation**: Multi-tier locale fallback chains (`de-AT-Vienna` → `de-AT` → `de` → `en`).
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

export const { LocLProvider, useTranslation, useLocL, Trans } = createLocLReact(translator);
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
  const { t, language, changeLanguage, direction } = useTranslation();

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

Renders translations containing formatting tags (`<bold>read</bold>`, `<link>terms</link>`) and self-closing elements (`<br />`) into React elements safely without `dangerouslySetInnerHTML`:

```tsx
<Trans
  i18nKey="notice" // "Please <bold>read</bold> our <link>terms</link>.<br />Thank you!"
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
- **Nested & Self-Closing Tags**: Supports self-closing tags (`<br />`, `<hr />`) and recursively parses nested elements (`<bold>Click <link>here</link></bold>`).
- **Dynamic Key Fallback**: Dynamic keys are permitted whenever an explicit `fallback` prop is provided (`fallback="Default string"`).
- **Scope Support**: Narrow keys using the `scope` prop: `<Trans scope="user" i18nKey="greeting" values={{ name: "Alice" }} />`.
- **Standalone `translator` Prop**: Automatically infers dictionaries from custom translator instances passed via `translator={translator}`.
- **Tag Element Replacement**: Clones JSX elements while preserving inner content as children.
- **Function Renderers**: Supports custom render functions: `(content) => <span className="font-bold">{content}</span>`.
- **Store-Versioned Reactive Updates**: Subscribes to `useSyncExternalStore` and internal store revisions so language and bundle updates trigger seamless re-renders.

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
    apple_other: "{count} apples"
  }
});
const locl = initLocL({ resources, fallbackLanguage: "en" });
export const i18n = toI18next(locl);

// Colon and dot syntax autocompleted and strictly enforced:
i18n.t("common:hello", { name: "Maria" }); // Requires { name }!
i18n.t("common.save");                    // Static key: options optional!

// Plurals strictly enforce { count: number }:
i18n.t("apple", { count: 5 });

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

- **Svelte**: Reference directly as an auto-subscribing readable store (`$translator.t("key")`).
- **Vue**: Bind to a `shallowRef` inside `translator.subscribe()`.
- **Solid**: Integrate with createSignal inside `translator.subscribe()`.
- **Node.js**: Cleanly isolate translations per request or per session.

---

## Rich Tag Interpolation (`translator.rich`)

Interpolate custom inline components, terminal styling, or HTML strings using `<tag>content</tag>` in vanilla and non-React environments:

```typescript
const en = {
  notice: "Click <link>here</link> to view details or <bold>read more</bold>.",
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
translator.addResources("en", {
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

// 1. Scoped proxy (inherits active language dynamically)
const authT = translator.withConfig({ scope: "auth" });
console.log(authT.t("login")); // "Log In"

// 2. Fixed-language proxy (pinned to German regardless of global language)
const deDashboardT = translator.withConfig({ scope: "dashboard", language: "de" });
console.log(deDashboardT.t("welcome", { name: "Hans" })); // "Willkommen, Hans"

// 3. Combined array scopes (merges multiple namespaces)
const multiT = translator.withConfig({ scope: ["auth", "dashboard"] });
console.log(multiT.t("dashboard.welcome", { name: "Alice" })); // "Welcome, Alice"
```

---

## API Reference

### Top-Level Exports (`locl-js`)

- **`initLocL(config)`**: Creates and returns a new `LocL` translator instance.
- **`defineResources(resources)`**: Identity helper using `<const T>` to enforce compile-time literal types without `as const`.
- **`defineStrictResources(resources)`**: Identity helper enforcing compile-time translation parity across all secondary languages against the fallback language.
- **`LangWithPlurals<T>`**: Type utility to enforce plural structures on translation packs.

### React Exports (`locl-js/react`)

- **`createLocLReact(translator)`**: Returns a pre-bound, zero-declaration React suite (`LocLProvider`, `useTranslation`, `useLocL`, `Trans`, `LocLContext`).
- **`LocLProvider`**: React Context Provider for managing the active translator.
- **`useTranslation(scope?, options?, customTranslator?)`**: Translation hook with scope support, `<Suspense>` mode (`{ suspense: true }`), loader overrides, and `ready: boolean` status.
- **`useLocL(customTranslator?)`**: Hook returning translator instance, active language, and bound translator APIs.
- **`<Trans />`**: Rich JSX component interpolation component supporting strict key/param validation, paired/self-closing tags, nested elements, fallbacks, and scope narrowing.
- **`LocLRegister`**: Ambient interface for global type registration.

### Compat Exports (`locl-js/compat`)

- **`toI18next(translator)`**: Wraps a LocL instance into an `i18next`-compatible API with strict parameter checking.
- **`createI18nextCompat(translator)`**: Alias of `toI18next`.

### `LocL` Instance Methods

- **`t(key, values?, format?)`**: Translates a key, handles interpolation, formatters, and plurals.
- **`plural(key, values, format?)`**: Translates a key with pluralization.
- **`rich(key, tagRenderers, values?)`**: Replaces `<tag>` wrappers using custom renderer functions.
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