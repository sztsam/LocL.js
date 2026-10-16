# Developer CLI & Localization Pipeline (`locl`)

LocL includes a production-grade developer command-line interface (`locl`) designed to automate translation key synchronization, parity checks in CI, coverage reporting, AI-driven machine translation, and Ahead-of-Time compilation.

---

## Installation & Setup

LocL CLI is included with the `locl-js` npm package. Add scripts to your `package.json`:

```json
{
  "scripts": {
    "i18n:extract": "locl extract",
    "i18n:check": "locl check",
    "i18n:lint": "locl check --lint-params",
    "i18n:translate": "locl translate",
    "i18n:status": "locl status",
    "i18n:compile": "locl compile"
  }
}
```

Or execute it on demand via `npx`:

```bash
npx locl --help
```

---

## 1. `locl extract` (Key Extraction)

Scans your source files (`.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, `.svelte`) and extracts translation keys into your base JSON file (`locales/en.json`):

```bash
# Default extraction: scans src/, app/, pages/, components/
npx locl extract

# Specify custom directories and file extensions
npx locl extract --src src,components --ext ts,tsx,vue --locales locales --base en

# Remove orphaned keys that are no longer referenced in source code
npx locl extract --clean

# Generate flat dot-notated JSON instead of nested objects
npx locl extract --flat

# Provide fallback placeholder value for new keys
npx locl extract --default "TODO_TRANSLATE"

# Dry run: view changes without writing to disk
npx locl extract --dry-run
```

### Detected Patterns

The extractor automatically detects:
- `t("auth.login")`, `tt("key")`
- `plural("cart.items", { count })`
- `ordinal("rank.placement", { count })`
- `rich("notice", ...)`
- `get("settings.title")`, `getObj("metadata")`
- JSX components: `<Trans i18nKey="terms.agree" fallback="I agree" />`

---

## 2. `locl check` (CI Parity & Parameter Linting)

Validates that all secondary language dictionaries (`de.json`, `es.json`, `fr.json`) have 100% parity with your base language dictionary (`en.json`). Perfect for CI/CD gates and pull request checks:

```bash
# Fails with exit code 1 if any language is missing keys
npx locl check --locales locales --base en

# Strict mode: fails if extraneous (orphaned) or empty string values exist
npx locl check --strict

# Automated backfill: inserts missing keys copying base language values
npx locl check --fix
```

### Parameter & Markup Tag Linting (`--lint-params` / `--lint`)

In v2.5.0, `locl check` includes deep linting for interpolation tokens and XML/JSX markup tags:

```bash
npx locl check --lint-params
```

#### What it Catches:
1. **Variable Mismatches**: If `en.json` has `"Hello, {name}!"`, but `es.json` mistakenly contains `"¡Hola, {usuario}!"`, linting detects the discrepancy.
2. **Missing Variables**: If `en.json` uses `{count}` and the translation forgot to include `{count}`.
3. **Broken / Mismatched Markup**: If `en.json` contains `<link>terms</link>` and the translated string omitted the `<link>` tags or renamed them.

When mismatches are detected, CI fails with exit code `1` and outputs a diagnostic report:

```text
LocL Parity Report (Base: en, 180 keys):
  • [es] ✖ Parameter/Tag Mismatches detected:
      Key: "checkout.greeting" -> Base params: ["name"], Target params: ["user"]
      Key: "auth.terms" -> Base tags: ["link"], Target tags: []
```

---

## 3. `locl translate` (Automated Machine & AI Translation)

Backfill untranslated keys automatically using AI and machine translation engines.

```bash
# Translate missing keys into Spanish and German using DeepL (default provider)
npx locl translate --target es,de

# Use OpenAI (default model: gpt-4o-mini)
npx locl translate --target es,fr --provider openai --model gpt-4o

# Run locally using Ollama (e.g. Llama 3) with zero cloud fees
npx locl translate --target de,ja --provider ollama --model llama3

# Use Google Cloud Translation API
npx locl translate --target zh,it --provider google

# Force re-translation of existing keys
npx locl translate --target es --force

# Dry run preview
npx locl translate --target es --dry-run
```

### Supported Providers & Environment Variables

| Provider | CLI Flag | Default Model / Target | Environment Variable |
| :--- | :--- | :--- | :--- |
| **DeepL** | `--provider deepl` | DeepL API Free / Pro | `DEEPL_API_KEY` |
| **OpenAI** | `--provider openai` | `gpt-4o-mini` | `OPENAI_API_KEY` |
| **Google Cloud** | `--provider google` | Google Translate v2 REST | `GOOGLE_TRANSLATE_API_KEY` |
| **Ollama** | `--provider ollama` | `llama3` (`http://localhost:11434`) | `OLLAMA_HOST` |

You can also override keys directly via `--api-key <KEY>`.

### Collision-Proof Token & Tag Masking

Machine translation APIs frequently corrupt variables (e.g. translating `{name}` into `{nombre}` or adding spaces `{ name }`) and damage HTML tags. LocL implements smart token masking:

1. Before translation, all placeholders (`{name}`, `{{name}}`, `{val | upper}`) and tags (`<bold>...</bold>`, `<br />`) are replaced with unique tokens: `__LOCL_TOK_0__`.
2. The translation provider only translates natural language.
3. After translation, LocL restores all tokens back to their exact original syntax with 100% precision.

---

## 4. `locl status` (Translation Coverage Matrix)

Displays a visual ASCII coverage matrix and percentage completion for each language:

```bash
npx locl status --locales locales --base en
```

Output:
```text
LocL Translation Coverage (Base: en, 210 keys):
  • [en] 100% [████████████████████] 210/210 keys (0 missing)
  • [de]  95% [███████████████████░] 200/210 keys (10 missing)
  • [es]  88% [█████████████████░░░] 185/210 keys (25 missing)
  • [fr]  72% [██████████████░░░░░░] 151/210 keys (59 missing)
```

---

## 5. `locl compile` (Ahead-of-Time Bundle Compilation)

Compiles your separate JSON files into a single, unified, tree-shakeable bundle for zero runtime fetch latency:

```bash
# Compile to TypeScript module exporting typed resources
npx locl compile --format ts --output src/locales.compiled.ts

# Compile to ECMAScript Module (ESM)
npx locl compile --format esm --output dist/locales.js

# Compile to CommonJS (CJS)
npx locl compile --format cjs --output dist/locales.cjs

# Compile to unified JSON bundle
npx locl compile --format json --output dist/locales.json
```

---

## Programmatic CLI API

Import CLI utilities in build scripts, GitHub Actions, or custom devtools:

```typescript
import {
  extractKeys,
  checkTranslations,
  compileTranslations,
  getTranslationStatus,
  translateTranslations,
  maskTokens,
  unmaskTokens
} from "locl-js/cli";

// Run parity and parameter check:
const check = checkTranslations({
  localesDir: "locales",
  baseLang: "en",
  lintParams: true
});

if (!check.success) {
  process.exit(1);
}

// Programmatic AI batch translation:
await translateTranslations({
  target: ["es", "de"],
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o-mini"
});
```
