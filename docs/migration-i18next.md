# Migrating from i18next (`locl-js/compat`)

LocL.js provides a drop-in compatibility adapter in `locl-js/compat` that mirrors the exact `i18next` API surface. You can migrate existing `i18next` codebases without refactoring thousands of callsites across your components.

---

## Why Switch from i18next to LocL?

1. **Massive Performance Boost**: LocL executes pre-compiled template plans without regular expression parsing on the hot path (10x–20x faster runtime throughput).
2. **True Compile-Time Safety**: Strict key validation and automatic parameter extraction (`{ count: number }`).
3. **Zero Dependencies**: Pure TypeScript, tiny footprint.
4. **React Server Components (RSC)**: Native async request isolation without client context leaks.

---

## 1. Drop-in Replacement (`toI18next`)

Wrap your `LocL` instance with `toI18next`:

```typescript
// src/i18n.ts
import { initLocL, defineResources } from "locl-js";
import { toI18next } from "locl-js/compat";

const resources = defineResources({
  en: {
    common: {
      save: "Save Changes",
      welcome: "Hello, {name}!"
    },
    auth: {
      login: "Sign In",
      register: "Create Account"
    },
    item_one: "1 item",
    item_other: "{count} items",
    rank_ordinal_one: "{count}st place",
    rank_ordinal_other: "{count}th place"
  }
});

const locl = initLocL({ resources, fallbackLanguage: "en" });

// Exports an i18next-compatible singleton instance:
export const i18n = toI18next(locl);
export default i18n;
```

---

## 2. Using Existing i18next Syntax

All common `i18next` conventions work seamlessly:

```typescript
// Colon namespace syntax:
i18n.t("common:welcome", { name: "Alice" }); // => "Hello, Alice!"
i18n.t("auth:login");                         // => "Sign In"

// Plurals via count parameter:
i18n.t("item", { count: 1 }); // => "1 item"
i18n.t("item", { count: 5 }); // => "5 items"

// Ordinals:
i18n.t("rank", { count: 1, ordinal: true }); // => "1st place"

// Language methods:
i18n.language;               // "en"
i18n.languages;              // ["en"]
i18n.dir();                  // "ltr"
await i18n.changeLanguage("de");

// Events:
i18n.on("languageChanged", (lng) => {
  console.log("Language changed to:", lng);
});
```

---

## 3. Migration Checklist

1. Replace `i18next.init(...)` with `initLocL(...)` and `toI18next(locl)`.
2. Existing `t("ns:key")` calls will work immediately.
3. Replace custom `i18next-browser-languagedetector` with native `locl-js/detector`.
4. Replace custom backend loaders with LocL's `createRemoteLoader` or dynamic `import()`.
