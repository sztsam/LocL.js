# LocL.js 🌐

[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/sztsam/LocL.js) [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://www.npmjs.com/package/locl-js)

**LocL** is an ultra-fast, lightweight, and fully-featured TypeScript internationalization (i18n) library. Designed for modern web applications, backend services, and multi-framework setups, it provides compile-time type-safety, automatic pluralization, ICU-style select branching, built-in formatters, and reactive subscriptions with **zero external dependencies**.

It is inspired by libraries like `i18next` and `react-i18next`, but engineered with a focus on strict TypeScript type checking, sub-millisecond execution, clean APIs, and 100% test coverage.

---

## Features ✨

- **💪 Strict Compile-Time Safety**: Auto-extracts parameters (`{name}`, `{{name}}`, `{gender, select, ...}`) and enforces required arguments at compile time with IDE autocomplete.
- **🏷️ `defineResources` Helper**: Preserves literal types automatically without having to append `as const` manually.
- **⚛️ First-Class React Integration**: Official React bindings (`<LocLProvider>`, `useTranslation`, `useLocL`, `<Trans />`) via `locl-js/react` with two type-safe workflows:
  - **`createLocLReact` Hook Factory**: Zero-declaration, pre-bound React suite.
  - **`LocLRegister` Declaration Merging**: Ambient global autocomplete for standalone imports.
- **📦 Zero Dependencies & Lightweight**: Pure TypeScript with no runtime dependencies.
- **🔄 Drop-in i18next Compat**: Swap existing `i18next` codebases effortlessly using `locl-js/compat` without rewriting translation call sites. Supports colon namespaces (`auth:login`), default fallbacks, and event listener cleanup.
- **🌐 Multi-Framework Reactive Store**: Implements the standard reactive store contract via `translator.subscribe()`, working out of the box in Svelte, Vue, Solid, and Node.js.
- **🔢 Automatic Plurals**: Handles object plurals (`{ zero, one, other }`) and suffix plurals (`_zero`, `_one`, `_other`) directly via `t()` or dedicated `plural()`.
- **🔀 ICU Select Support**: Conditional branching (`{gender, select, male {He} female {She} other {They}}`) with nested parameter interpolation (`{gender, select, male {He has {count} items}}`).
- **🔧 Built-in & Custom Formatters**: Format dates, numbers, currencies, strings, and booleans inline via pipe syntax (`{val | number}`, `{date | date:short}`).
- **⚡ High Performance Caching**: Granular scope-based translation caching and multi-proxy instance reuse.
- **🛡️ Prototype-Safe Dynamic Resources**: Safely merge resources dynamically at runtime with built-in prototype pollution guards.
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
    messages: {
      one: "You have one message.",
      other: "You have {count} messages.",
    },
  },
  fr: {
    hello: "Bonjour, {name}!",
    messages: {
      one: "Vous avez un message.",
      other: "Vous avez {count} messages.",
    },
  },
});

const translator = initLocL({
  resources,
  fallbackLanguage: "en",
});

// Interpolation
console.log(translator.t("hello", { name: "Alice" })); // "Hello, Alice!"

// Plurals via t() or plural()
console.log(translator.t("messages", { count: 1 })); // "You have one message."
console.log(translator.plural("messages", { count: 5 })); // "You have 5 messages."

// Switch language
translator.changeLanguage("fr");
console.log(translator.t("hello", { name: "Alice" })); // "Bonjour, Alice!"
```

---

## Strict Parameter Type-Checking

When defining resources with `defineResources` (or `as const`), `LocL` infers parameter names and types at compile time:

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

---

## React Integration (`locl-js/react`)

`LocL` provides flicker-free React bindings powered by `useSyncExternalStore` and an XSS-safe `<Trans />` component. You can choose between two type-safe workflows:

### Workflow A: Zero-Declaration Factory (`createLocLReact`) ⭐ *Recommended*

No `.d.ts` declaration merging required. Bind your translator once and export typed components and hooks:

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
  // 100% Autocomplete across root keys!
  const { t, language, changeLanguage } = useTranslation();

  return (
    <header>
      <h1>{t("welcome", { name: "Alice" })}</h1>
      <button onClick={() => changeLanguage("de")}>Deutsch ({language})</button>
    </header>
  );
}

function Profile() {
  // Scoped autocomplete: keys are restricted to the "user" namespace!
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

If you prefer importing directly from `"locl-js/react"`, augment `LocLRegister` once in your project (e.g. `src/i18n.d.ts`):

```typescript
import { translator } from "./i18n";

declare module "locl-js/react" {
  interface LocLRegister {
    translator: typeof translator;
  }
}
```

Now, standalone imports automatically have full autocomplete everywhere:

```tsx
import { useTranslation, Trans } from "locl-js/react";

function UserProfile() {
  const { t } = useTranslation("user"); // ✅ Scopes and keys autocompleted globally!
  return <h1>{t("title")}</h1>;
}
```

---

### The `<Trans />` Component

Renders complex translations containing formatting tags (`<bold>read</bold>`, `<link>terms</link>`) into React elements safely without `dangerouslySetInnerHTML`:

```tsx
<Trans
  i18nKey="notice" // "Please <bold>read</bold> our <link>terms</link>."
  values={{ name: "Alice" }}
  components={{
    bold: <strong className="text-primary font-bold" />,
    link: <a href="/terms" className="underline" target="_blank" rel="noopener noreferrer" />,
  }}
  fallback="Please read our terms."
/>
```

- **Tag element replacement**: Replaces tags with JSX elements (e.g. `<strong />`) while preserving inner text as children.
- **Function renderers**: Supports custom render functions: `(content) => <span style={{ fontWeight: "bold" }}>{content}</span>`.
- **Reactive updates**: Subscribes to `useSyncExternalStore` so language changes re-render smoothly.

---

## Drop-in `i18next` Compatibility (`locl-js/compat`)

Migrate existing `i18next` codebases effortlessly without refactoring callsites:

```typescript
import { initLocL } from "locl-js";
import { toI18next, createI18nextCompat } from "locl-js/compat";

const locl = initLocL({ resources, fallbackLanguage: "en" });
export const i18n = toI18next(locl);

// Standard i18next patterns supported seamlessly:
i18n.t("common:login", { name: "Alice" }); // Colon namespaces
i18n.t("common.login");                   // Dot namespaces
i18n.t("missing.key", "Default String");   // Default values
i18n.exists("common:login");              // Key existence checks

// Plurals via count:
i18n.t("apple", { count: 5 });             // "5 apples"

// Dynamic resource bundle management:
i18n.addResourceBundle("en", "dynamic", { title: "Title" });
i18n.hasResourceBundle("en", "dynamic");   // true
i18n.getResourceBundle("en", "dynamic");   // { title: "Title" }

// Event listeners with unbind cleanup:
const unbind = i18n.on("languageChanged", (lng) => {
  console.log("Language changed to", lng);
});
unbind(); // Unsubscribes listener

await i18n.changeLanguage("es");
```

---

## Pluralization

`LocL` supports pluralization directly inside `translator.t()` and through `translator.plural()`. Both approaches automatically resolve CLDR plural rules (`zero`, `one`, `two`, `few`, `many`, `other`).

### 1. Object Pluralization

Define plurals as structured objects:

```typescript
const en = {
  items: {
    zero: "No items",
    one: "1 item",
    other: "{count} items",
  },
};

translator.t("items", { count: 0 }); // "No items"
translator.t("items", { count: 1 }); // "1 item"
translator.t("items", { count: 5 }); // "5 items"
```

### 2. Suffix Pluralization

Define plural forms using category suffixes:

```typescript
const en = {
  apple_zero: "Zero apples",
  apple_one: "1 apple",
  apple_other: "{count} apples",
};

translator.t("apple", { count: 1 }); // "1 apple"
translator.t("apple", { count: 4 }); // "4 apples"
```

> **Note**: Both single `{var}` and double `{{var}}` placeholders are supported across all templates.

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
  user: "Username: {name | upper | truncate:10, ...}",
};
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
const unsubscribe = translator.subscribe((newLang, prevLang) => {
  console.log(`Language updated from ${prevLang} to ${newLang}`);
});

translator.changeLanguage("es");
unsubscribe();
```

- **Svelte**: Reference directly as an auto-subscribing readable store (`$translator.t("key")`).
- **Vue**: Bind to a `shallowRef` inside `translator.subscribe()`.
- **Node.js**: Cleanly isolate translations per request or per guild.

---

## Rich Tag Interpolation (`translator.rich`)

Interpolate custom inline components, terminal styling, or HTML strings using `<tag>content</tag>`:

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

## Dynamic Resources

Add or deep-merge translation bundles at runtime safely with built-in prototype pollution guards:

```typescript
// Add a single dotted key
translator.addResource("en", "dashboard.title", "Analytics Dashboard");

// Deep-merge an entire namespace
translator.addResources("en", {
  checkout: {
    pay: "Pay Now",
    cancel: "Cancel",
  },
});
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

// 3. Array scope (combines multiple namespaces)
const multiT = translator.withConfig({ scope: ["auth", "dashboard"] });
console.log(multiT.t("dashboard.welcome", { name: "Alice" })); // "Welcome, Alice"
```

---

## API Reference

### Top-Level Exports (`locl-js`)

- **`defineResources(resources)`**: Identity helper using `<const T>` to enforce compile-time literal types without writing `as const`.
- **`initLocL(config)`**: Creates and returns a new `LocL` translator instance.

### React Exports (`locl-js/react`)

- **`createLocLReact(translator)`**: Returns a pre-bound React suite (`LocLProvider`, `useTranslation`, `useLocL`, `Trans`).
- **`LocLProvider`**: React Context Provider for the active translator.
- **`useTranslation(scope?, customTranslator?)`**: Translation hook with scope support.
- **`useLocL(customTranslator?)`**: Hook returning translator instance and reactive language state.
- **`<Trans />`**: Rich JSX tag interpolation component.
- **`LocLRegister`**: Ambient interface for global type registration.

### Compat Exports (`locl-js/compat`)

- **`toI18next(translator)`**: Wraps a LocL instance into an `i18next`-compatible API.
- **`createI18nextCompat(translator)`**: Alias of `toI18next`.

### `LocL` Instance Methods

- **`t(key, values?, format?)`**: Translates a key, handles interpolation, formatters, and plurals.
- **`plural(key, values, format?)`**: Translates a key with pluralization.
- **`rich(key, tagRenderers, values?)`**: Replaces `<tag>` wrappers using custom renderer functions.
- **`changeLanguage(lang)`**: Updates current language and notifies all subscribers.
- **`getLanguage()`**: Returns the currently active language code.
- **`subscribe(listener)`**: Subscribes to language changes. Returns an unsubscribe function.
- **`withConfig(config)`**: Returns a cached proxy translator instance with scoped configuration.
- **`clone(language?, scope?)`**: Clones the translator instance with optional language/scope overrides.
- **`addResource(lang, key, value)`**: Adds or overrides a single translation key at runtime.
- **`addResources(lang, bundle)`**: Deep-merges a dictionary into the target language.
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