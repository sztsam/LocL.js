# Changelog

All notable changes to **LocL.js** are documented here.

## [2.5.0] — 2026-10-16

### Added

- **ICU Inline Plural Syntax & Offset Support (`{count, plural, ...}`)**:
  - Full inline ICU MessageFormat plural syntax support inside translation templates: `{count, plural, =0 {No items} =1 {One item} one {# item} other {# items}}`.
  - Exact quantity selectors (`=0`, `=1`, `=N`) and standard Unicode CLDR categories (`zero`, `one`, `two`, `few`, `many`, `other`).
  - Supports `offset:N` syntax (e.g. `{count, plural, offset:1 =0 {No users} =1 {You} one {You and # other} other {You and # others}}`).
  - Automatic number substitution with `#`, formatted using native `Intl.NumberFormat` for the active language. Literal `#` characters can be escaped with `\#`.
  - Nested template interpolation inside plural cases (e.g. `{count, plural, one {Item: {name}} other {Items: {name}}}`).
  - Compile-time TypeScript type inference: template parsing infers `{ count: number }` for inline plural parameters alongside any nested variable tokens.
- **Automated AI & Machine Translation CLI (`locl translate` / `locl-js/cli`)**:
  - Added `locl translate --target <locales> [options]` command to automatically backfill missing translations via machine and AI translation providers.
  - Multi-provider support:
    - **DeepL** (`--provider deepl`): Native API integration supporting free and pro endpoints (`DEEPL_API_KEY`).
    - **OpenAI** (`--provider openai`): GPT models (default `gpt-4o-mini`, `--model`, `OPENAI_API_KEY`) with structured JSON schema output.
    - **Google Cloud Translation** (`--provider google`): Google Translate v2 REST API (`GOOGLE_TRANSLATE_API_KEY`).
    - **Ollama** (`--provider ollama`): Local offline LLM execution (default model `llama3`, configurable `--ollama-host`, default `http://localhost:11434`).
    - **Custom Translator**: Programmatic async translator hook (`customTranslator`).
  - Robust Token Masking (`maskTokens`, `unmaskTokens`): Automatically detects and masks variables (`{{var}}`, `{var | fmt}`) and JSX/HTML tags (`<bold>...</bold>`, `<br />`) as `__LOCL_TOK_N__` before sending to translation APIs, guaranteeing placeholders and markup are never altered or translated.
  - Batching & concurrency: Automatically batches strings (`--batch-size`, default: 50) to optimize API usage and rate limits.
  - Flags: `--target, -t`, `--provider, -p`, `--api-key, -k`, `--model`, `--ollama-host`, `--force` (re-translate existing keys), `--dry-run`, `--base, -b`, `--locales, -l`.
  - Programmatic exports: `translateTranslations`, `maskTokens`, `unmaskTokens`, `translateBatchWithProvider`, and types `TranslateOptions`, `TranslateResult`, `TranslationProvider`.
- **Parameter & Tag Parity Linting (`locl check --lint-params` / `--lint`)**:
  - Added template token and markup linting to `locl check`.
  - Compares interpolation parameters (e.g., `{name}`, `{count}`) and XML/JSX tags (e.g., `<bold>`, `<a>`) across all target language translations against the base language.
  - Fails CI execution with exit code 1 when mismatches are detected and provides actionable reports detailing conflicting keys, missing parameters, and inconsistent tags.
- **Over-The-Air (OTA) Remote Loader with Stale-While-Revalidate (`createRemoteLoader`)**:
  - Exported `createRemoteLoader` from `locl-js` for dynamic remote dictionary loading and continuous OTA content delivery.
  - Stale-While-Revalidate (SWR): Serves cached translations immediately from local storage for instantaneous boot times while revalidating and refreshing translations in the background.
  - Configurable storage backends: `"localStorage"` (browser default), `"sessionStorage"`, `"memory"`, or custom `RemoteLoaderStorage` (`getItem`, `setItem`, `removeItem`).
  - Flexible endpoint resolution: URL template string (`https://cdn.example.com/locales/{lang}/{ns}.json`) or dynamic callback function `(lang, ns) => string`.
  - Configurable cache TTL (`maxAge`, default: 24h), storage key prefix (`storagePrefix`), custom request headers or async header resolver function, and `onSuccess` / `onError` lifecycle callbacks.
  - Programmatic cache invalidation: `loader.clearCache(lang?, ns?)`.
- **First-Class Svelte Store Integration (`locl-js/svelte`)**:
  - Dedicated Svelte package export: `import { createLocLSvelte } from "locl-js/svelte"`.
  - Adheres to standard Svelte store contract with `subscribe()`, allowing idiomatic `$t("key")` reactive subscriptions in Svelte 4 and Svelte 5 (`svelte/store`).
  - Automatically triggers component re-renders whenever `translator.changeLanguage()` is called.
- **First-Class Vue 3 Composable Integration (`locl-js/vue`)**:
  - Dedicated Vue package export: `import { createLocLVue } from "locl-js/vue"`.
  - Exposes reactive `{ t, language, translator }` composable seamlessly integrated with Vue 3's reactivity model.
  - Supports optional custom `shallowRef` wrapper or works out of the box with zero external dependencies.
- **Vite Plugin & Hot Module Replacement (`locl-js/vite`)**:
  - Dedicated Vite package export: `import { loclVitePlugin, setupLocLHmr } from "locl-js/vite"`.
  - Watches translation JSON files in the locales directory and dispatches HMR events (`locl:update`) over Vite's development WebSocket server.
  - Live-updates in-memory translations and re-renders active UI views instantly without full page reloads.
- **SSR Hydration & Localized Routing in React (`locl-js/react`)**:
  - `<LocLHydrate state={dehydratedState} translator={...} />`: Injects `<script id="__LOCL_DATA__" type="application/json">` for client hydration and initializes client-side translator state and resources without layout shifts or flash of unlocalized content.
  - `<Link href="..." locale="..." prefixStrategy="...">`: Localization-aware anchor component that automatically rewrites internal links according to routing prefix strategies (`"as-needed"`, `"always"`, `"never"`).
  - `useLocalizedPath(prefixStrategy?)`: React hook returning a path localization helper `(pathname, localeOverride?) => string`.
  - Exposed directly on `createLocLReact`: `suite.Hydrate`, `suite.Link`, `suite.useLocalizedPath`.
- **Server Dehydration Helper (`locl-js/server`)**:
  - Added `dehydrate(translatorOrSuite?)`: Serializes active server translator state, locale, resources, and direction into a `DehydratedLocLState` payload for client hydration.
  - Added `getLocalizedPath(pathname, locale, defaultLocale, prefixStrategy, locales?)` helper to `locl-js/detector` and `locl-js/server`.
- **Extended Built-in Formatters (Lists & Display Names)**:
  - `list`: Formats arrays using native `Intl.ListFormat`. Supports `{items | list}`, `{items | list:de,disjunction}`, and style options (`long`, `short`, `narrow`).
  - `languageName`: Localizes language codes into human-readable display names via `Intl.DisplayNames`. Example: `{lang | languageName:en}` → `"German"`, `{lang | languageName:de}` → `"Deutsch"`.
  - `regionName`: Localizes country and region codes into display names. Example: `{country | regionName:en}` → `"United States"`.
  - `currencyName`: Localizes ISO 4217 currency codes into display names. Example: `{curr | currencyName:en}` → `"US Dollar"`.
  - `displayName`: Generalized display name formatter supporting any `Intl.DisplayNames` type (`language`, `region`, `currency`, `script`, `calendar`). Example: `{code | displayName:language,en}`.
  - High-performance LRU-style instance caching for `Intl.ListFormat` and `Intl.DisplayNames`.
- **Package Exports & Optional Peer Dependencies**:
  - Added subpath exports `./vite`, `./svelte`, and `./vue` in `package.json`.
  - Added optional peer dependencies for `svelte` (`>=4.0.0 || >=5.0.0`), `vue` (`>=3.0.0`), and `vite` (`>=4.0.0 || >=5.0.0 || >=6.0.0`).

## [2.4.0] — 2026-10-15

### Added

- **Developer CLI & Localization Pipeline (`locl` / `locl-js/cli`)**:
  - Full-featured command-line tool accessible via `npx locl` or npm scripts (`npm run i18n:...`).
  - `locl extract`: Scans `.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, and `.svelte` files across configurable source directories (`--src`, `--ext`). Extracts translation keys from `t()`, `tt()`, `plural()`, `ordinal()`, `rich()`, `get()`, `getObj()`, and `<Trans i18nKey="..." fallback="..." />` into base JSON dictionaries (`locales/en.json`). Supports `--flat`, `--clean`/`--prune` (removes orphaned keys), `--dry-run`, `--sort`/`--no-sort`, and default value generation (`--default`).
  - `locl check`: Automated CI verification tool checking translation key parity across all secondary language files against the fallback language. Detects missing, extraneous, and empty keys. Supports `--fix` (automatically backfills missing keys preserving flat or nested structures) and `--strict`.
  - `locl status`: Visual matrix report displaying language coverage percentages and ASCII completion bars (`█░`).
  - `locl compile`: Ahead-of-Time (AOT) compiles JSON localization files into optimized TypeScript (`ts`), ECMAScript Module (`esm`), CommonJS (`cjs`), or unified `json` bundles.
  - Programmatic API exported from `locl-js/cli`: `extractKeys`, `checkTranslations`, `compileTranslations`, `getTranslationStatus`.
- **Universal Language Detection & Route Middleware (`locl-js/detector`)**:
  - `detectBrowserLanguage(options)`: Configurable multi-tier browser language detector prioritizing querystring parameters (`?lang=de`), cookies (`NEXT_LOCALE`), `localStorage`, `sessionStorage`, `navigator.languages`, HTML `<html lang="...">` attributes, or custom detector functions.
  - `persistLanguage(language, options)`: Persists active language preferences across cookies, `localStorage`, `sessionStorage`, and the HTML root element.
  - `attachDetector(translator, options)`: Attaches automatic detection and auto-persists language updates on `changeLanguage()`.
  - RFC 7231 / RFC 2616 compliant `Accept-Language` header parser: `parseAcceptLanguage(header)` and `getAcceptedLanguages(header)` supporting arbitrary whitespace, quality weights (`q=0.9`), and clamping.
  - `matchLanguage(accepted, supported, fallback)` (aliased as `negotiateLanguage`): Advanced BCP 47 language negotiation with exact matching, subtag truncation (`de-AT-Vienna` → `de-AT` → `de`), regional prefix matching (`fr` → `fr-CA`), and `*` wildcard support.
  - Full-Stack Route Middleware (`resolveRouteLocale`, `createI18nMiddleware`, `handleI18nRouting`):
    - Zero-boilerplate Web Standard (`Request` → `Response`) middleware compatible with Next.js App Router, Astro, Cloudflare Workers, and Node servers.
    - Path prefix strategies: `"as-needed"` (default: default locale has no prefix, secondary locales prefixed), `"always"`, and `"never"`.
    - Handles automatic 307 redirects, rewrites, cookie syncing (`Set-Cookie`), routing headers (`x-locl-locale`, `x-locl-pathname`), and static asset ignoring.
  - SEO Alternate Links (`getHreflangLinks`): Generates alternate `hreflang` link objects along with `x-default` for search engine indexing.
- **Native Ordinal Pluralization (`translator.ordinal()`)**:
  - Added native ordinal plural formatting (`1st`, `2nd`, `3rd`, `4th`, `21st`) powered by `Intl.PluralRules({ type: "ordinal" })`.
  - Supported via `translator.ordinal(key, values, format?)`, `translator.plural(key, { count, ordinal: true })`, and `translator.t(key, { count, ordinal: true })`.
  - Dual-mode plural object support: nested `ordinal: { one: "...", two: "...", few: "...", other: "..." }` blocks inside existing cardinal plural objects.
  - Suffix ordinals: `${key}_ordinal_one`, `${key}_ordinal_two`, `${key}_ordinal_few`, `${key}_ordinal_other`, `${key}_ordinal_=1`, `${key}_ordinal_zero`.
  - Available across all integrations: `useTranslation().ordinal`, `useLocL().ordinal`, `t.ordinal` in `locl-js/server`, and `i18n.ordinal()` in `locl-js/compat`.
- **Language-Aware Unicode CLDR Plural Validation (`LangWithPlurals<T, L>`)**:
  - `LangWithPlurals<T, L>` now dynamically adapts required plural categories based on target language `L`:
    - Other-only languages (`ja`, `zh`, `ko`, `vi`, `th`, `id`, `ms`, `tr`, `hu`, etc.): Only requires `other` (no unnecessary `one` category required).
    - Slavic languages (`ru`, `uk`, `pl`, `cs`, `sk`, etc.): Enforces `one`, `few`, `many`, and `other`.
    - Arabic (`ar`): Enforces `zero`, `one`, `two`, `few`, `many`, and `other`.
    - Standard Germanic/Romance (`en`, `de`, `fr`, `es`): Enforces `one` and `other`.
- **Production Telemetry Hook (`onMissingKey`)**:
  - Added optional `onMissingKey: (key, language, fallbackChain) => void` hook to `initLocL` configuration for error reporting and missing-key logging.
- **Dictionary Reconstitution (`unflattenDictionary`)**:
  - Added `unflattenDictionary(flat)` runtime utility that reconstructs deeply nested dictionaries from dot-notated objects while preserving plural objects and protecting against prototype pollution.
- **Tag Attributes in `<Trans />` and `rich()`**:
  - Both `<Trans />` and `translator.rich()` now support elements with attributes (e.g. `<link href="/terms" target="_blank">terms</link>`, `<br className="divider" />`).
- **Server Module Routing Re-exports**:
  - `locl-js/server` now re-exports route resolution and middleware utilities (`resolveRouteLocale`, `createI18nMiddleware`, `handleI18nRouting`, `getHreflangLinks`, `HreflangLink`).

## [2.3.0] — 2026-10-14

### Added

- **Headless Async Request Isolation (`locl-js/server`)**:
  - Full support for React Server Components (RSC), Next.js App Router, Astro, Remix, and Express/Fastify powered by Node's native `AsyncLocalStorage`.
  - Zero client-side React Context overhead; enables direct translation execution in async server components without `"use client"`.
  - `createLocLServer(translator, options?)` factory returning an isolated server suite:
    - `getTranslator(scope?, options?)`: Asynchronously resolves request-scoped translations, auto-loads missing namespaces via `translator.load()`, and invokes optional custom `getLocale()` resolvers (e.g., reading headers/cookies).
    - `getTranslations(scope?, options?)`: Convenient alias for `getTranslator()` matching modern Next.js conventions.
    - `getSyncTranslator(scope?, options?)`: Synchronous translator for in-memory server contexts.
    - `runWithLocale(locale, fn)`: Runs synchronous or asynchronous request subtrees with isolated locale bindings.
    - `runWithTranslator(translator, fn)`: Binds an isolated custom `LocL` translator instance to the current asynchronous execution context.
    - `getLocale()` & `setLocale(locale)`: Request-scoped locale getters and setters.
  - Multi-purpose `ServerTranslator`: Callable directly as `t("key", values)` while providing attached helper methods and reactive getters (`t.t`, `t.plural`, `t.rich`, `t.format`, `t.get`, `t.language`, `t.direction`, `t.isRTL()`, `t.translator`).
  - Standalone module-level server exports (`getTranslator`, `getTranslations`, `runWithLocale`, `setServerTranslator`, etc.) with `LocLServerRegister` ambient interface support for zero-boilerplate server typing.
- **Safe Type Mode for Large Dictionaries (`strictParams: false`)**:
  - Added `strictParams?: boolean` option to `initLocL()`: setting `strictParams: false` instructs the TypeScript compiler to bypass recursive template-literal parsing (`ExtractInterpolationParams`, `ScanParams`, `ReadBalanced`) across large dictionaries.
  - Retains 100% compile-time key autocompletion and path validation while eliminating `tsc` instantiation depth slowdowns.
- **Pre-Flattened Dictionary Utilities**:
  - `flattenDictionary(obj)`: Runtime utility that flattens nested dictionaries into dot-notated objects while preserving plural objects for build-time and startup optimizations.
  - `defineFastResources(resources)`: Identity helper for lightweight dictionary declarations.

## [2.2.0] — 2026-10-13

### Performance

- **Compiled Token Cache & Plan Memoization (10x–20x Runtime Throughput Boost)**:
  - Replaced repetitive per-call string regex tokenization and string splitting with a pre-parsed execution plan (`TemplateChunk[]`).
  - Pre-parses static literals, dynamic variable tokens, formatter argument pipelines (`{name | trim | upper | truncate:10}`), and ICU select branches on first access, caching the plan in a `Map<string, TemplateChunk[]>`.
  - Subsequent translations execute a tight, linear concatenation loop over pre-allocated chunks, virtually eliminating garbage collection pressure during rapid component re-renders.
  - Cached `Intl.DateTimeFormat` and `Intl.NumberFormat` instances per locale to eliminate repeated engine constructor calls.

### Added

- **Plural Exact Values (`=0`, `=1`, `=N`)**:
  - Added support for exact quantity exceptions in object plurals (e.g. `{ "=0": "No items", "=1": "1 item", other: "{count} items" }`) and suffix plurals (e.g. `messages_=0`, `messages_=1`).
  - Prioritizes exact numeric matches over grammatical Unicode CLDR categories (`zero`, `one`, `other`).
  - Added `ExactPluralForms` and `PluralKeyForms` type exports to strictly type-check exact quantities and keep `{ count: number }` autocompleted.
- **RTL Language Utilities & Automatic Document Sync**:
  - Added `translator.getDirection(lang?)` returning `"ltr" | "rtl"`. Uses native `Intl.Locale` (`getTextInfo()`), ISO 15924 script subtags (`Arab`, `Hebr`), and comprehensive ISO 639 language fallbacks (`ar`, `he`, `fa`, `ur`, `ps`, etc.).
  - Added `translator.isRTL(lang?)` returning a boolean.
  - Added `translator.getMetadata(lang?)` returning `{ language, direction, isRTL }`.
  - Automatic browser `<html dir="..." lang="...">` synchronization on translator initialization and whenever `changeLanguage()` is called (configurable via `autoSyncDocument?: boolean`).
  - Exposed reactive `direction`, `isRTL()`, and `getDirection()` on React hooks (`useTranslation()`, `useLocL()`), and `i18n.dir()` in `locl-js/compat`.

### Changed

- Enhanced `NestedKeyOf` and `NestedKeyOfObj` to treat plural objects as leaf translation keys, preventing autocomplete from polluting suggestions with internal plural branch paths like `messages.=0` or `messages.one`.

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
