import { extractKeys, type ExtractOptions, type ExtractResult } from "./extract.js";
import { checkTranslations, type CheckOptions, type CheckResult } from "./check.js";
import { compileTranslations, type CompileOptions, type CompileResult } from "./compile.js";
import { getTranslationStatus, type StatusOptions, type StatusResult } from "./status.js";
import { translateTranslations, maskTokens, unmaskTokens, translateBatchWithProvider, type TranslateOptions, type TranslateResult, type TranslationProvider } from "./translate.js";

export { extractKeys, checkTranslations, compileTranslations, getTranslationStatus, translateTranslations, maskTokens, unmaskTokens, translateBatchWithProvider };
export type { ExtractOptions, ExtractResult, CheckOptions, CheckResult, CompileOptions, CompileResult, StatusOptions, StatusResult, TranslateOptions, TranslateResult };

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<number> {
  const command = argv[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(`
LocL.js CLI — Developer Tooling & Localization Pipeline

Usage:
  locl <command> [options]

Commands:
  extract      Scans source files (.ts, .tsx, .vue, .svelte) and syncs keys to JSON
  check        Verifies translation parity across secondary languages in CI
  status       Displays visual coverage matrix and percentage completion
  translate    Automated AI/machine translation for missing keys (DeepL, OpenAI, Google, Ollama)
  compile      Ahead-of-Time (AOT) compiles dictionaries into optimized bundles

Options:
  --target, -t     Target languages for translation (e.g. es,de,fr)
  --provider, -p   Translation provider: deepl | openai | google | ollama (default: deepl)
  --api-key, -k    API key override for provider
  --src, -s        Source directory to scan (default: src, app, components)
  --locales, -l    Locales directory (default: locales)
  --base, -b       Base language code (default: en)
  --output, -o     Output file path
  --format, -f     Compilation format: ts | esm | cjs | json (default: ts)
  --fix            Auto-adds missing keys to secondary languages
  --force          Forces re-translation of existing keys
  --strict         Fails if extraneous or empty keys are found
  --clean          Removes orphaned keys from translation file
  --dry-run        Runs extraction/translation without writing to disk
  --flat           Generates single-level dot keys
  --version, -v    Displays version
`);
    return 0;
  }

  if (command === "--version" || command === "-v") {
    console.log("2.5.0");
    return 0;
  }

  const parseFlag = (name: string): string | undefined => {
    const idx = argv.indexOf(name);
    return idx !== -1 && argv[idx + 1] ? argv[idx + 1] : undefined;
  };
  const hasFlag = (name: string): boolean => argv.includes(name);

  const localesDir = parseFlag("--locales") || parseFlag("-l") || "locales";
  const baseLang = parseFlag("--base") || parseFlag("-b") || "en";
  const src = parseFlag("--src") || parseFlag("-s");
  const output = parseFlag("--output") || parseFlag("-o");
  const format = (parseFlag("--format") || parseFlag("-f") || "ts") as CompileOptions["format"];
  const target = parseFlag("--target") || parseFlag("-t");
  const provider = (parseFlag("--provider") || parseFlag("-p") || "deepl") as TranslationProvider;
  const apiKey = parseFlag("--api-key") || parseFlag("-k");

  try {
    if (command === "extract") {
      const res = extractKeys({
        localesDir,
        baseLang,
        src,
        outputFile: output,
        flat: hasFlag("--flat"),
        clean: hasFlag("--clean") || hasFlag("--prune"),
        dryRun: hasFlag("--dry-run"),
        sort: !hasFlag("--no-sort"),
        extensions: parseFlag("--ext") ? parseFlag("--ext")!.split(",").map((e) => e.trim().startsWith(".") ? e.trim() : `.${e.trim()}`) : undefined,
        defaultValue: parseFlag("--default") || parseFlag("--default-value")
      });
      console.log(`✔ [LocL] Extracted ${res.newKeysCount} new keys across ${res.filesScanned} files into "${res.outputFile}" (Total: ${res.totalKeysCount})`);
      return 0;
    }

    if (command === "check") {
      const res = checkTranslations({
        localesDir,
        baseLang,
        fix: hasFlag("--fix"),
        strict: hasFlag("--strict"),
        lintParams: hasFlag("--lint-params") || hasFlag("--lint")
      });

      console.log(`\nLocL Parity Report (Base: ${res.baseLang}, ${res.totalBaseKeys} keys):`);
      for (const [lang, info] of Object.entries(res.locales)) {
        const status = info.missing.length === 0 ? "✔ OK" : `✖ ${info.missing.length} missing`;
        console.log(`  • [${lang}] ${status} (${info.total} keys, ${info.extraneous.length} extra, ${info.empty.length} empty)`);
        if (info.missing.length > 0) {
          console.log(`    Missing: ${info.missing.slice(0, 5).join(", ")}${info.missing.length > 5 ? "..." : ""}`);
        }
      }

      if (!res.success) {
        console.error("\n❌ [LocL] Parity check failed. Use --fix or 'locl translate' to automatically backfill missing keys.");
        return 1;
      }
      console.log("\n✔ [LocL] All language dictionaries are in parity.");
      return 0;
    }

    if (command === "translate") {
      if (!target) {
        console.error("❌ [LocL] Missing required argument: --target <locales> (e.g. locl translate --target es,de)");
        return 1;
      }
      const res = await translateTranslations({
        target,
        localesDir,
        baseLang,
        provider,
        apiKey,
        dryRun: hasFlag("--dry-run"),
        force: hasFlag("--force")
      });

      console.log(`\nLocL Auto-Translation Report (Provider: ${res.provider}, Base: ${res.baseLang}):`);
      for (const [lang, info] of Object.entries(res.locales)) {
        console.log(`  • [${lang}] Translated ${info.translated} keys (${info.skipped} skipped, ${info.total} total) -> ${info.file}`);
      }
      console.log("\n✔ [LocL] Auto-translation complete.");
      return 0;
    }

    if (command === "status") {
      const res = getTranslationStatus({ localesDir, baseLang });
      console.log(`\nLocL Translation Coverage (Base: ${res.baseLang}, ${res.totalKeys} keys):`);
      for (const [lang, stat] of Object.entries(res.locales)) {
        const bar = "█".repeat(Math.floor(stat.percentage / 5)) + "░".repeat(20 - Math.floor(stat.percentage / 5));
        console.log(`  • [${lang}] ${stat.percentage.toString().padStart(3)}% [${bar}] ${stat.translated}/${stat.total} keys (${stat.missing} missing)`);
      }
      return 0;
    }

    if (command === "compile") {
      const res = compileTranslations({
        localesDir,
        output,
        format
      });
      console.log(`✔ [LocL] Compiled ${res.localesCount} locales (${res.keysCount} keys) into "${res.outputFile}"`);
      return 0;
    }

    console.error(`[LocL] Unknown command: "${command}". Run "locl --help" for available commands.`);
    return 1;
  } catch (err: any) {
    console.error(`[LocL] Error: ${err.message}`);
    return 1;
  }
}
