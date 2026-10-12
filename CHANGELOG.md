# Changelog

All notable changes to **LocL.js** are documented here.

## [2.1.0] — 2026-10-12

### Added

- **Lazy Loading Namespaces & Bundles**:
  - Added `translator.load(lang, ns, loader)`, `translator.loadLanguage(lang, loader)`, and `translator.loadNamespace(ns, lang, loader)` to support on-demand network loading and bundler code-splitting.
  - Added `translator.isLoaded(lang, ns)` to verify loading status across both monolithic language bundles (`de.json`) and modular namespaces (`de/dashboard.json`).
  - Added universal `ResourceLoader` resolution supporting raw JSON, ES Module dynamic `import()` with `.default`, TypeScript named exports (`translations`, `messages`, `resources`), factory functions, and direct browser `fetch()` `Response` objects.
  - Added native React `<Suspense>` integration via `useTranslation(scope, { suspense: true })` with built-in failure TTL handling to prevent infinite suspense retry loops.
  - Added non-suspense background loading with a reactive `ready: boolean` flag in `useTranslation()`.
- **Compile-Time Translation Parity (`defineStrictResources`)**:
  - Added `defineStrictResources()` and the `EnforceParity<T, Fallback>` type helper to strictly catch missing translation keys in secondary languages at compile time against the fallback language.
- **Multi-Pipe Formatter Chaining**:
  - Added pipeline formatting execution in translation tokens (e.g. `{val | trim | upper | truncate:10, ...}`), evaluating formatters sequentially from left to right.
- **Built-in Pseudo-Localization (Enterprise QA Mode)**:
  - Added `pseudoLocalization` configuration option during initialization and `translator.setPseudoLocalization()` runtime toggle.
  - Automatically transforms ASCII letters into accented characters (`[!!! Ḩéļļö Ŵöŕļđ !!!]`) while keeping HTML/JSX tags (`<bold>`, `<link>`) and interpolation tokens (`{name}`, `{{name}}`) completely intact.
- **BCP 47 Language Negotiation Fallback Chains**:
  - Added hierarchical locale fallback resolution (e.g. `de-AT-Vienna` → `de-AT` → `de` → `fallbackLanguage`).
  - Added `translator.getFallbackChain(lang)` helper method.
- **Store Versioning & External Store Stability**:
  - Added `translator.getVersion()` integer tracking language switches, dynamic resource additions, and lazy bundle arrivals to guarantee immediate `useSyncExternalStore` React re-renders.
- **Nested & Self-Closing Tags in `<Trans />`**:
  - Added support for self-closing JSX elements (e.g., `<br />`, `<hr />`, `<spacer />`) in addition to paired tags.
  - Added recursive element parsing to support nested tags (e.g., `<bold>Click <link>here</link></bold>`).
  - Added automatic fallback check for suffix plurals (`${key}_other`) in `<Trans />`.
- **Type-Evolved `addResources()`**:
  - `addResources()` now returns a strongly-typed instance using `DeepMergeResources<T, L, B>`, allowing subsequent `t()` calls to autocomplete and type-check newly injected resources at compile time.
- **Expanded React Hook API**:
  - Added `ready`, `tt`, `get`, `getObj`, and `getLanguage` to the objects returned by `useTranslation()` and `useLocL()`.
- **Enhanced i18next Compatibility (`locl-js/compat`)**:
  - Connected `i18n.loadNamespaces()` directly to `translator.load()`.
  - Added automatic missing-language preloading to `await i18n.changeLanguage(lng)`.
  - Unified `i18n.hasResourceBundle()` with `translator.isLoaded()`.

## [2.0.1] — 2026-10-09

### Fixed

- Enforced strict parameter checking in `toI18next()` so templates with variables (`{name}`) and plural counts (`{count}`) are strictly validated at compile time, including colon-syntax keys (`common:hello`).
- Fixed generic dictionary inference on `<Trans translator={translator} />` so `i18nKey` provides full IDE autocomplete when passing an explicit translator instance.
- Restored strict compile-time key validation in `<Trans />`, strictly checking known keys and permitting arbitrary strings only when an explicit `fallback` prop is provided.

### Security

- Hardened `addResource` and `addResources` against prototype pollution by rejecting any path segments containing `__proto__`, `constructor`, or `prototype` before object traversal.

## [2.0.0] — 2026-10-08

### Added

- Official React bindings (`locl-js/react`) powered by `useSyncExternalStore` for concurrent-safe React 18 and 19 rendering:
  - `<LocLProvider>` context provider for managing and distributing translator instances.
  - `useTranslation(scope)` and `useLocL()` hooks with reactive language subscriptions and namespace scoping.
  - `<Trans />` component for rich JSX tag interpolation (`<bold>`, `<link>`) without `dangerouslySetInnerHTML`.
  - `createLocLReact(translator)` hook factory for pre-bound, zero-declaration type-safe React setups.
  - `LocLRegister` ambient interface for global type registration and autocomplete across standalone imports.
- Drop-in `i18next` compatibility adapter (`locl-js/compat`):
  - `toI18next()` and `createI18nextCompat()` wrapper functions supporting colon namespaces (`common:login`) and dotted paths.
  - Support for `defaultValue` string and option fallbacks, `exists()` key verification, and resource bundle inspection.
  - Event listener support (`i18n.on('languageChanged')`) returning an unsubscribe cleanup function.
- Recursive ICU `select` syntax with nested placeholder interpolation (e.g. `{gender, select, male {He has {count} items}}`).
- `defineResources()` identity helper with TypeScript `<const T>` inference, preserving literal types without manual `as const`.
- `translator.rich()` method for tokenized rich-text tag replacement across vanilla and non-React environments.
- Prototype-pollution security guards in `addResource` and `addResources`.

### Changed

- Overhauled TypeScript type engine with recursive template literal extraction to enforce required parameters (`{name}`, `{{name}}`, and ICU syntax) at compile time.
- Updated `withConfig()` proxy handler to prevent nested Proxy-of-Proxy chains by anchoring directly to the root instance.
- Isolated language change events so pinned fixed-language proxies ignore irrelevant global locale updates.

### Performance

- Cached `Intl.PluralRules` instances per locale to eliminate expensive repeated runtime instantiation.
- Differentiated dynamic language proxies from fixed-language proxies in cache keys to ensure React reference stability.
- Serialized array scopes in React hooks to prevent `useMemo` cache invalidation on inline array literals.
- Achieved 100% test coverage across all statements, branches, functions, and lines.

## [1.0.2] — 2026-01-29

### Changed

- Made formatter arguments optional across the built-in formatters, defaulting to an empty argument list when none are provided.
- Improved TypeScript type safety for nested translation keys by adding bounded recursion to `NestedKeyOf` and `NestedKeyOfObj`.
- Added bounded recursion to plural-key extraction to keep complex translation types from expanding indefinitely.
- Broadened formatter argument typings so built-in formatter APIs are easier to consume directly.

### Performance

- Cached proxy translator instances created by `withConfig`, avoiding repeated proxy construction for the same configuration.

## [1.0.1] — 2025-10-01

### Changed

- Improved type-safe nested translation paths to support both string and numeric keys.
- Extended `PathValue` type resolution to handle numeric path segments, improving typing for array/index-based access.
- Improved scope-aware type inference in `LocL` configuration and initialization.
- Simplified the return typing of `t()` so the inferred result follows the actual value at the requested translation path.
- Exported `LangWithPlurals` as a type-only export for cleaner TypeScript module output.

## [1.0.0] — 2025-09-27

### Added

- First complete release of LocL.js, a lightweight TypeScript internationalization (i18n) library.
- Type-safe translation keys and `LangWithPlurals` support.
- Language selection, language switching, and fallback-language handling.
- String interpolation with named values.
- Pluralization using both plural-form objects and `_one` / `_other` suffixes.
- Built-in formatters for casing, trimming, truncation, numbers, currency, dates, relative dates, JSON, booleans, and padding.
- Support for custom formatters and optional default formatters.
- Translation scopes, including support for combining multiple scopes.
- Translation caching for fast repeated lookups.
- Development-mode warnings for missing translations.
- `t()`, `plural()`, `get()`, `format()`, `withConfig()`, and `clone()` APIs.
- ESM/CommonJS builds with generated TypeScript declarations.
