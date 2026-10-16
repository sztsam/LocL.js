# Getting Started with LocL.js

Welcome to the comprehensive documentation for **LocL.js** (v2.5.0), the ultra-fast, zero-dependency internationalization (i18n) engine for modern TypeScript web applications, React Server Components (RSC), and full-stack frameworks.

---

## Installation

Install `locl-js` using your package manager of choice:

```bash
# npm
npm install locl-js

# pnpm
pnpm add locl-js

# yarn
yarn add locl-js

# bun
bun add locl-js
```

LocL.js is zero-dependency and includes built-in TypeScript declarations out of the box.

---

## 5-Minute Quick Start

### 1. Define Dictionaries (`defineResources`)

Use `defineResources()` to declare your translation keys. It infers literal types and template placeholders automatically without requiring manual `as const` annotations:

```typescript
// src/i18n.ts
import { initLocL, defineResources } from "locl-js";

export const resources = defineResources({
  en: {
    welcome: "Welcome back, {name}!",
    cart: {
      "=0": "Your shopping cart is empty.",
      one: "You have 1 item in your cart.",
      other: "You have {count} items in your cart."
    },
    notifications: "{count, plural, offset:1 =0 {No notifications} =1 {You have a notification} other {You and # others have notifications}}",
    auth: {
      login: "Log In",
      register: "Create Account"
    }
  },
  de: {
    welcome: "Willkommen zurück, {name}!",
    cart: {
      "=0": "Ihr Warenkorb ist leer.",
      one: "Sie haben 1 Artikel im Warenkorb.",
      other: "Sie haben {count} Artikel im Warenkorb."
    },
    notifications: "{count, plural, offset:1 =0 {Keine Benachrichtigungen} =1 {Sie haben eine Benachrichtigung} other {Sie und # weitere haben Benachrichtigungen}}",
    auth: {
      login: "Anmelden",
      register: "Konto erstellen"
    }
  }
});
```

### 2. Initialize the Translator Instance

Initialize `LocL` by specifying your resources and fallback language:

```typescript
export const translator = initLocL({
  resources,
  fallbackLanguage: "en",
  language: "en"
});
```

### 3. Translate Keys

```typescript
// Simple interpolation
translator.t("welcome", { name: "Alice" }); 
// => "Welcome back, Alice!"

// Object Plurals (evaluates exact '=0' over category)
translator.t("cart", { count: 0 }); 
// => "Your shopping cart is empty."

translator.t("cart", { count: 5 }); 
// => "You have 5 items in your cart."

// ICU Inline Plural with offset and # formatting
translator.t("notifications", { count: 3 }); 
// => "You and 2 others have notifications"

// Switch language at runtime
translator.changeLanguage("de");
translator.t("welcome", { name: "Alice" }); 
// => "Willkommen zurück, Alice!"
```

---

## Compile-Time Safety: `defineResources` vs `defineStrictResources`

LocL provides two primary resource helpers:

### `defineResources`
Ensures compile-time string literal preservation so template tokens (`{name}`, `{count}`) and key hierarchies are autocompleted by TypeScript. Secondary languages may have partial sets of keys.

```typescript
const resources = defineResources({
  en: { hello: "Hello" },
  fr: { hello: "Bonjour" }
});
```

### `defineStrictResources`
Enforces **100% translation key parity at compile time**. If any secondary language is missing a key present in the base fallback language, TypeScript flags a compilation error directly in your IDE:

```typescript
const strictResources = defineStrictResources({
  en: { hello: "Hello", goodbye: "Goodbye" },
  // ❌ Type error: Property 'goodbye' is missing in 'de'
  de: { hello: "Hallo" } 
});
```

---

## Configuration Options (`LocLConfig`)

When creating an instance via `initLocL(options)`, you can customize:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `resources` | `Record<string, any>` | `{}` | Initial translation dictionaries. |
| `fallbackLanguage` | `string` | `"en"` | Language to fall back to if a key is missing. |
| `language` | `string` | `fallbackLanguage` | Initial active language code. |
| `loader` | `ResourceLoader` | `undefined` | Async loader for dynamic namespaces or bundles. |
| `formatters` | `Record<string, Formatter>` | `{}` | Custom formatter functions. |
| `strictParams` | `boolean` | `true` | Set to `false` for large dictionaries (10k+ keys) to speed up `tsc`. |
| `onMissingKey` | `(key, lang, chain) => void` | `undefined` | Production telemetry callback for tracking untranslated keys. |
| `pseudoLocalization`| `boolean \| PseudoOptions` | `false` | Enables QA layout testing with accented text expansion. |
| `autoSyncDocument` | `boolean` | `true` | Syncs `<html dir="..." lang="...">` in browser environments automatically. |

---

## Scoped Translators (`withConfig`)

Create lightweight, isolated translator proxies without cloning resources or memory duplication:

```typescript
// Pinned to the "auth" namespace
const auth = translator.withConfig({ scope: "auth" });
auth.t("login"); // Resolves "auth.login"

// Pinned to a fixed language regardless of global state
const deTranslator = translator.withConfig({ language: "de" });
deTranslator.t("welcome", { name: "Hans" }); // Always in German
```
