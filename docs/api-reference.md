# Full API Reference

Exhaustive TypeScript API reference for all packages and modules in **LocL.js v2.5.0**.

---

## 1. Top-Level Core Exports (`locl-js`)

### `initLocL<T, Fallback, S, F, Strict>(config: LocLConfig)`
Initializes and returns a new `LocL` translator instance.

```typescript
const translator = initLocL({
  resources,
  fallbackLanguage: "en",
  language: "en",
  strictParams: true,
  onMissingKey: (key, lang, chain) => {},
  pseudoLocalization: false
});
```

### `defineResources(resources)`
Identity helper leveraging TypeScript 5 `<const T>` to preserve string literal types and enable automatic parameter inference without explicit `as const`.

### `defineStrictResources(resources)`
Identity helper enforcing compile-time translation parity across all secondary languages against the base language.

### `defineFastResources(resources)`
Bypasses recursive template type evaluation for enterprise dictionaries with 10,000+ keys while retaining autocomplete.

### `createRemoteLoader(options: RemoteLoaderOptions): RemoteLoaderInstance`
Creates an Over-The-Air (OTA) remote translation loader featuring Stale-While-Revalidate (SWR) caching and offline fallback.

### `flattenDictionary(obj: Record<string, any>): Record<string, any>`
Flattens nested dictionaries into single-level dot-notated objects while preserving plural objects (`{ one, other }`).

### `unflattenDictionary(flat: Record<string, any>): Record<string, any>`
Reconstructs deeply nested dictionary objects from dot-notated keys while protecting against prototype pollution.

### `LangWithPlurals<T, Language>`
Dynamic type utility enforcing CLDR-valid plural categories tailored to the target language code.

---

## 2. `LocL` Translator Instance Methods

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `t(key, values?, format?)` | `key: K, values?: Values, format?: FormatterOptions` | `string` | Translates a key, evaluates variables, formatters, and plurals. |
| `plural(key, values, format?)` | `key: K, values: PluralValues, format?: FormatterOptions` | `string` | Translates a key with cardinal plural rule evaluation. |
| `ordinal(key, values, format?)` | `key: K, values: PluralValues, format?: FormatterOptions` | `string` | Translates a key with ordinal plural rule evaluation (`1st`, `2nd`). |
| `rich(key, tagRenderers, values?)` | `key: K, tagRenderers: Record<string, Function>, values?: Values` | `(string \| any)[]` | Interpolates XML/JSX-style markup tags into custom elements. |
| `changeLanguage(lang)` | `lang: string` | `void` | Changes active language, updates DOM attributes, notifies subscribers. |
| `getLanguage()` | - | `string` | Returns active language code. |
| `getDirection(lang?)` | `lang?: string` | `"ltr" \| "rtl"` | Returns script direction for active or specified language. |
| `isRTL(lang?)` | `lang?: string` | `boolean` | Returns `true` if language is right-to-left. |
| `getMetadata(lang?)` | `lang?: string` | `{ language, direction, isRTL }` | Returns structured locale metadata. |
| `getFallbackChain(lang?)`| `lang?: string` | `string[]` | Returns BCP 47 hierarchical fallback chain. |
| `subscribe(listener)` | `(newLang, prevLang, meta) => void` | `() => void` | Subscribes to language changes. Returns unsubscribe function. |
| `withConfig(config)` | `{ scope?, language? }` | `LocL` | Returns cached proxy instance with scoped namespace or language. |
| `addResource(lang, key, value)`| `lang, key, value` | `this` | Overrides or adds a single translation key at runtime. |
| `addResources(lang, bundle)` | `lang, bundle` | `DeepMergedLocL` | Deep-merges dictionary, returning type-evolved translator instance. |
| `format(value, formatter, args?)` | `val, formatterName, args?` | `string` | Direct formatter execution. |
| `getVersion()` | - | `number` | Returns store revision counter for store versioning. |

---

## 3. React Exports (`locl-js/react`)

- **`createLocLReact(translator)`**: Returns `{ LocLProvider, useTranslation, useLocL, Trans, Hydrate, Link, useLocalizedPath, LocLContext }`.
- **`<LocLProvider translator={translator}>`**: React Context Provider.
- **`<LocLHydrate state={dehydratedState} translator? />`**: Client hydration component embedding server JSON data script and synchronizing client translator resources without UI layout shift.
- **`<Link href="..." locale? prefixStrategy? />`**: Localization-aware anchor element automatically applying routing prefix strategies.
- **`useLocalizedPath(prefixStrategy?)`**: Hook returning a path generator function `(pathname, localeOverride?) => string`.
- **`useTranslation(scope?, options?, customTranslator?)`**: Main translation hook with `<Suspense>` mode (`{ suspense: true }`), loader overrides, and `ready: boolean` status.
- **`useLocL(customTranslator?)`**: Hook returning translator instance, active language, and bound translator APIs.
- **`<Trans i18nKey="..." values? components? fallback? scope? />`**: Rich JSX component interpolation supporting strict key/param validation, attributes in tags, paired/self-closing tags, nested elements, fallbacks, and scope narrowing.
- **`LocLRegister`**: Ambient interface for global type registration.

---

## 4. Server Exports (`locl-js/server`)

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

---

## 5. Universal Detector & Routing Exports (`locl-js/detector`)

- **`createI18nMiddleware(options)`** / **`handleI18nRouting(options)`**: Web Standard middleware for Next.js App Router, Astro, and edge runtimes.
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

---

## 6. Developer CLI Exports (`locl-js/cli`)

- **`extractKeys(options: ExtractOptions): Promise<ExtractResult>`**: Scans codebases and extracts translation keys into JSON dictionaries.
- **`checkTranslations(options: CheckOptions): CheckResult`**: Verifies translation parity, parameter/tag matching (`lintParams: true`), missing keys, and extraneous keys in CI.
- **`translateTranslations(options: TranslateOptions): Promise<TranslateResult>`**: Programmatically triggers automated AI and machine translation for missing keys (DeepL, OpenAI, Google, Ollama).
- **`maskTokens(text: string): { masked: string, tokens: string[] }`**: Shields variable tokens (`{name}`) and XML/JSX tags (`<bold>`) as `__LOCL_TOK_N__` before sending to translation APIs.
- **`unmaskTokens(text: string, tokens: string[]): string`**: Restores shielded tokens into translated strings.
- **`translateBatchWithProvider(texts, from, to, options)`**: Low-level batch translation dispatcher across supported providers.
- **`getTranslationStatus(options: StatusOptions): StatusResult`**: Computes translation completion matrix and statistics.
- **`compileTranslations(options: CompileOptions): CompileResult`**: Compiles JSON dictionaries into TS, ESM, CJS, or JSON bundles.
- **`runCli(argv?: string[]): Promise<number>`**: Programmatic entrypoint for running the `locl` CLI.

---

## 7. Framework Integrations

### Svelte (`locl-js/svelte`)
- **`createLocLSvelte(translator)`**: Wraps any `LocL` translator into a native Svelte readable store adhering to the Svelte store contract (`$t()`).

### Vue (`locl-js/vue`)
- **`createLocLVue(translator, shallowRefFn?)`**: Wraps any `LocL` translator into a Vue 3 reactive composable exposing `{ t, language, translator }`.

### Vite (`locl-js/vite`)
- **`loclVitePlugin(options?)`**: Vite development plugin detecting JSON dictionary updates and dispatching `locl:update` HMR WebSocket events.
- **`setupLocLHmr(translator, hot)`**: Client-side development helper binding Vite's `import.meta.hot` to hot-reload translations live without full page refresh.

### Compatibility (`locl-js/compat`)
- **`toI18next(translator)`**: Wraps a LocL instance into an `i18next`-compatible API with strict parameter checking.
- **`createI18nextCompat(translator)`**: Alias of `toI18next`.
