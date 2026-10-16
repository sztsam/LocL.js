# Framework Integrations (Svelte, Vue, Vite, Solid)

While LocL.js provides official React bindings, it is designed from the core to be framework-agnostic. In v2.5.0, LocL introduces dedicated packages for **Svelte**, **Vue 3**, and **Vite**.

---

## Svelte Integration (`locl-js/svelte`)

`createLocLSvelte` wraps your `LocL` translator into a native Svelte readable store. Compatible with both **Svelte 4** and **Svelte 5**:

```bash
npm install locl-js
```

### Setup

```typescript
// src/i18n.ts
import { initLocL, defineResources } from "locl-js";
import { createLocLSvelte } from "locl-js/svelte";

export const translator = initLocL({
  resources: defineResources({
    en: { welcome: "Hello, {name}!" },
    de: { welcome: "Hallo, {name}!" }
  }),
  fallbackLanguage: "en"
});

// Creates an auto-subscribing readable store
export const t = createLocLSvelte(translator);
```

### In Your Svelte Components

Use the standard `$t` auto-subscription syntax. The component automatically re-renders whenever the language changes:

```svelte
<!-- src/App.svelte -->
<script lang="ts">
  import { t, translator } from "./i18n";
</script>

<main>
  <h1>{$t("welcome", { name: "Svelte" })}</h1>
  <button on:click={() => translator.changeLanguage("de")}>
    Deutsch
  </button>
  <button on:click={() => translator.changeLanguage("en")}>
    English
  </button>
</main>
```

---

## Vue 3 Integration (`locl-js/vue`)

`createLocLVue` provides a Vue 3 Composition API composable that binds translator state into Vue's reactivity system.

```bash
npm install locl-js
```

### Setup

```typescript
// src/i18n.ts
import { initLocL, defineResources } from "locl-js";
import { createLocLVue } from "locl-js/vue";
import { shallowRef } from "vue";

export const translator = initLocL({
  resources: defineResources({
    en: { greeting: "Welcome to Vue 3, {name}!" },
    fr: { greeting: "Bienvenue sur Vue 3, {name}!" }
  }),
  fallbackLanguage: "en"
});

export function useI18n() {
  return createLocLVue(translator, shallowRef);
}
```

### In Your Vue Components

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { useI18n, translator } from "./i18n";

const { t, language } = useI18n();
</script>

<template>
  <main>
    <h1>{{ t("greeting", { name: "Alex" }) }}</h1>
    <p>Current language: {{ language }}</p>
    <button @click="translator.changeLanguage('fr')">Français</button>
  </main>
</template>
```

---

## Vite Plugin & Hot Module Replacement (`locl-js/vite`)

Update translation files during development without full page reloads or losing application state. LocL's Vite plugin watches your `locales/` directory and dispatches HMR events over Vite's development WebSocket.

### 1. Configure `vite.config.ts`

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

### 2. Connect Client HMR

In your application entrypoint:

```typescript
// src/i18n.ts
import { initLocL } from "locl-js";
import { setupLocLHmr } from "locl-js/vite";

export const translator = initLocL({
  resources: { /* initial translations */ },
  fallbackLanguage: "en"
});

// In development, hot-reload translations live:
if (import.meta.hot) {
  setupLocLHmr(translator, import.meta.hot);
}
```

Whenever you modify any translation JSON file, all text in your browser updates instantaneously!

---

## Solid.js & Vanilla JavaScript

LocL implements the standard reactive store contract via `translator.subscribe()`:

```typescript
// Solid.js example:
import { createSignal, onCleanup } from "solid-js";
import { translator } from "./i18n";

export function useSolidI18n() {
  const [lang, setLang] = createSignal(translator.getLanguage());

  const unsubscribe = translator.subscribe((newLang) => {
    setLang(newLang);
  });
  onCleanup(unsubscribe);

  return {
    t: translator.t.bind(translator),
    language: lang
  };
}
```
