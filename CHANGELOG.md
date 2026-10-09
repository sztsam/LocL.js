# Changelog

All notable changes to **LocL.js** are documented here.

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
