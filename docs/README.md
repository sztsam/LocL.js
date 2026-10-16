# LocL.js Documentation 🌐

Welcome to the official documentation for **LocL.js (v2.5.0)** — the ultra-fast, lightweight, and complete TypeScript internationalization library.

LocL is designed from the ground up for modern developer ergonomics: compile-time parameter extraction, pre-compiled template execution, native ICU inline plurals, React Server Components (RSC), automated AI translation CLI, universal detection, and first-class framework adapters for React, Svelte, Vue 3, and Vite.

---

## Documentation Guides

Explore the modular documentation guides:

| Section | Description |
| :--- | :--- |
| [🚀 Getting Started](./getting-started.md) | Installation, 5-minute quick start, `defineResources`, scopes, and config options. |
| [🛠️ Developer CLI](./cli.md) | `locl extract`, `locl check` (with parameter/tag linting), `locl translate` (AI translation), `locl status`, and `locl compile`. |
| [🔀 Plurals & ICU Syntax](./plurals-and-icu.md) | ICU inline plurals, `offset:N`, `#` formatting, exact quantities (`=0`, `=1`), ordinals (`1st`, `2nd`), and CLDR rules. |
| [⚛️ React Integration](./react.md) | `createLocLReact`, `useTranslation`, `<Trans />`, `<LocLHydrate />`, `<Link />`, and `<Suspense>` lazy loading. |
| [🖥️ Server Components (RSC)](./server.md) | React Server Components, Next.js App Router, `AsyncLocalStorage`, request isolation, and `dehydrate()`. |
| [🧡 Framework Integrations](./frameworks.md) | Svelte store (`createLocLSvelte`, `$t`), Vue 3 composable (`createLocLVue`), and Vite HMR (`loclVitePlugin`). |
| [🔧 Built-in Formatters](./formatters.md) | `list` (`Intl.ListFormat`), `languageName`, `regionName`, `currencyName`, `displayName`, multi-pipe chaining, custom formatters. |
| [📡 OTA Remote Loader](./remote-loader.md) | Continuous translation delivery, Stale-While-Revalidate (SWR) caching, offline resilience, and cache invalidation. |
| [🌐 Detection & Routing](./detector-routing.md) | Browser language detection, RFC 7231 Accept-Language, BCP 47 negotiation, Web Standard middleware, and SEO hreflang links. |
| [🔄 Migrating from i18next](./migration-i18next.md) | Zero-rewrite drop-in migration using `locl-js/compat`. |
| [📑 Full API Reference](./api-reference.md) | Complete TypeScript API reference across all packages and exported methods. |

---

## Key Benchmarks & Capabilities

- **📦 Zero Dependencies**: Pure TypeScript core with zero runtime dependencies.
- **🛡️ 100% Test Coverage**: Verified across all 12 test suites and 255 unit and integration tests.
- **🌍 Full CLDR Support**: Accurate language-aware plural category rules across hundreds of locales.
