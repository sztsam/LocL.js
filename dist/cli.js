#!/usr/bin/env node

// src/cli/extract.ts
import fs from "fs";
import path from "path";
var DEFAULT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte"];
var DEFAULT_SRC_DIRS = ["src", "app", "pages", "components"];
function collectFiles(dir, extensions, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist" || entry.name === "build" || entry.name === ".next") {
        continue;
      }
      collectFiles(fullPath, extensions, results);
    } else if (entry.isFile()) {
      if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}
function extractKeysFromContent(content) {
  const results = [];
  const seen = /* @__PURE__ */ new Set();
  const fnRegex = /\b(?:t|tt|plural|ordinal|rich|get|getObj)\s*\(\s*(['"`])([^'"`\r\n]+)\1(?:\s*,\s*(['"`])([^'"`\r\n]*)\3)?/g;
  let match;
  while ((match = fnRegex.exec(content)) !== null) {
    const key = match[2];
    const defaultValue = match[4];
    if (key && !seen.has(key)) {
      seen.add(key);
      results.push({ key, defaultValue });
    }
  }
  const transRegex = /<([a-zA-Z0-9_.]*Trans)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
  while ((match = transRegex.exec(content)) !== null) {
    const attrs = match[2];
    const keyMatch = attrs.match(/\bi18nKey=(?:(['"`])([^'"`\r\n]+)\1|\{\s*(['"`])([^'"`\r\n]+)\3\s*\})/);
    const fallbackMatch = attrs.match(/\bfallback=(?:(['"`])([^'"`\r\n]+)\1|\{\s*(['"`])([^'"`\r\n]+)\3\s*\})/);
    const key = keyMatch ? keyMatch[2] || keyMatch[4] : void 0;
    const defaultValue = fallbackMatch ? fallbackMatch[2] || fallbackMatch[4] : void 0;
    if (key && !seen.has(key)) {
      seen.add(key);
      results.push({ key, defaultValue });
    }
  }
  return results;
}
function setNested(target, keyPath, value) {
  const parts = keyPath.split(".");
  let cur = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (p === "__proto__" || p === "constructor" || p === "prototype") {
      return;
    }
    if (!cur[p] || typeof cur[p] !== "object") {
      cur[p] = {};
    }
    cur = cur[p];
  }
  const last = parts[parts.length - 1];
  if (last === "__proto__" || last === "constructor" || last === "prototype") {
    return;
  }
  if (cur[last] && typeof cur[last] === "object" && typeof value !== "object") {
    return;
  }
  cur[last] = value;
}
function sortObject(obj) {
  const sorted = {};
  for (const k of Object.keys(obj).sort()) {
    sorted[k] = obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k]) ? sortObject(obj[k]) : obj[k];
  }
  return sorted;
}
function extractKeys(options = {}) {
  const extensions = options.extensions ?? DEFAULT_EXTENSIONS;
  const srcDirs = options.src ? Array.isArray(options.src) ? options.src : [options.src] : DEFAULT_SRC_DIRS.filter((d) => fs.existsSync(d));
  if (srcDirs.length === 0) {
    srcDirs.push(".");
  }
  const files = [];
  for (const dir of srcDirs) {
    files.push(...collectFiles(dir, extensions));
  }
  const allFoundKeys = [];
  const seenKeys = /* @__PURE__ */ new Set();
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const extracted = extractKeysFromContent(content);
    for (const item of extracted) {
      if (!seenKeys.has(item.key)) {
        seenKeys.add(item.key);
        allFoundKeys.push(item);
      }
    }
  }
  const localesDir = options.localesDir ?? "locales";
  const baseLang = options.baseLang ?? "en";
  const outPath = options.outputFile ?? path.join(localesDir, `${baseLang}.json`);
  let currentJson = {};
  if (fs.existsSync(outPath) && !options.clean) {
    try {
      currentJson = JSON.parse(fs.readFileSync(outPath, "utf8"));
    } catch {
    }
  }
  let newKeysCount = 0;
  for (const item of allFoundKeys) {
    const val = item.defaultValue !== void 0 ? item.defaultValue : typeof options.defaultValue === "function" ? options.defaultValue(item.key) : options.defaultValue ?? item.key;
    if (options.flat) {
      if (currentJson[item.key] === void 0) {
        currentJson[item.key] = val;
        newKeysCount++;
      }
    } else {
      const parts = item.key.split(".");
      let cur = currentJson;
      let exists = true;
      for (const p of parts) {
        if (!cur || typeof cur !== "object" || !(p in cur)) {
          exists = false;
          break;
        }
        cur = cur[p];
      }
      if (!exists) {
        setNested(currentJson, item.key, val);
        newKeysCount++;
      }
    }
  }
  const finalOutput = options.sort !== false ? sortObject(currentJson) : currentJson;
  if (!options.dryRun) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(finalOutput, null, 2) + "\n", "utf8");
  }
  return {
    filesScanned: files.length,
    keysFound: Array.from(seenKeys),
    newKeysCount,
    totalKeysCount: Object.keys(finalOutput).length,
    outputFile: outPath
  };
}

// src/cli/check.ts
import fs2 from "fs";
import path2 from "path";

// src/index.ts
function flattenDictionary(obj, prefix = "") {
  const result = {};
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return result;
  }
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const keys = Object.keys(val);
      const isPlural = keys.length > 0 && keys.every(
        (k) => ["zero", "one", "two", "few", "many", "other"].includes(k) || k.startsWith("=") || k === "ordinal"
      );
      if (isPlural) {
        result[fullKey] = val;
      } else {
        Object.assign(result, flattenDictionary(val, fullKey));
      }
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}
function unflattenDictionary(flat) {
  const result = {};
  if (!flat || typeof flat !== "object" || Array.isArray(flat)) {
    return result;
  }
  for (const [keyPath, val] of Object.entries(flat)) {
    const parts = keyPath.split(".");
    let cur = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (p === "__proto__" || p === "constructor" || p === "prototype") {
        break;
      }
      if (!cur[p] || typeof cur[p] !== "object" || Array.isArray(cur[p])) {
        cur[p] = {};
      }
      cur = cur[p];
    }
    const last = parts[parts.length - 1];
    if (last !== "__proto__" && last !== "constructor" && last !== "prototype") {
      cur[last] = val;
    }
  }
  return result;
}

// src/cli/check.ts
function checkTranslations(options = {}) {
  const localesDir = options.localesDir ?? "locales";
  const baseLang = options.baseLang ?? "en";
  const basePath = path2.join(localesDir, `${baseLang}.json`);
  if (!fs2.existsSync(basePath)) {
    throw new Error(`[LocL/check] Base language file not found: "${basePath}"`);
  }
  const baseContent = JSON.parse(fs2.readFileSync(basePath, "utf8"));
  const flatBase = flattenDictionary(baseContent);
  const baseKeys = Object.keys(flatBase);
  const entries = fs2.readdirSync(localesDir).filter((f) => {
    if (!f.endsWith(".json")) {
      return false;
    }
    if (f === `${baseLang}.json`) {
      return false;
    }
    if (f.startsWith(".") || f.includes(".compiled.")) {
      return false;
    }
    return true;
  });
  const locales = {};
  let overallSuccess = true;
  for (const file of entries) {
    const lang = file.replace(/\.json$/, "");
    const targetPath = path2.join(localesDir, file);
    const targetContent = JSON.parse(fs2.readFileSync(targetPath, "utf8"));
    const flatTarget = flattenDictionary(targetContent);
    const missing = baseKeys.filter((k) => flatTarget[k] === void 0);
    const extraneous = Object.keys(flatTarget).filter((k) => flatBase[k] === void 0);
    const empty = Object.keys(flatTarget).filter((k) => flatTarget[k] === "");
    let fixedCount = 0;
    if (options.fix && missing.length > 0) {
      for (const k of missing) {
        flatTarget[k] = flatBase[k];
      }
      const isTargetOriginallyNested = Object.values(targetContent).some(
        (v) => v && typeof v === "object" && !Array.isArray(v) && !Object.keys(v).every(
          (k) => ["zero", "one", "two", "few", "many", "other"].includes(k) || k.startsWith("=") || k === "ordinal"
        )
      );
      const fixedOutput = isTargetOriginallyNested ? unflattenDictionary(flatTarget) : flatTarget;
      fs2.writeFileSync(targetPath, JSON.stringify(fixedOutput, null, 2) + "\n", "utf8");
      fixedCount = missing.length;
    }
    if (missing.length > 0 && !options.fix) {
      overallSuccess = false;
    }
    if (options.strict && (extraneous.length > 0 || empty.length > 0)) {
      overallSuccess = false;
    }
    locales[lang] = {
      missing: options.fix ? [] : missing,
      extraneous,
      empty,
      total: Object.keys(flatTarget).length,
      fixed: fixedCount
    };
  }
  return {
    success: overallSuccess,
    baseLang,
    totalBaseKeys: baseKeys.length,
    locales
  };
}

// src/cli/compile.ts
import fs3 from "fs";
import path3 from "path";
function compileTranslations(options = {}) {
  const localesDir = options.localesDir ?? "locales";
  const format = options.format ?? "ts";
  const defaultExt = format === "ts" ? "ts" : format === "json" ? "json" : "js";
  const outPath = options.output ?? `src/locales.compiled.${defaultExt}`;
  if (!fs3.existsSync(localesDir)) {
    throw new Error(`[LocL/compile] Locales directory not found: "${localesDir}"`);
  }
  const files = fs3.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
  const bundles = {};
  let totalKeys = 0;
  for (const file of files) {
    const lang = file.replace(/\.json$/, "");
    const content = JSON.parse(fs3.readFileSync(path3.join(localesDir, file), "utf8"));
    bundles[lang] = content;
    totalKeys += Object.keys(content).length;
  }
  let code = "";
  if (format === "ts") {
    code = `// Auto-generated by LocL CLI (locl compile). Do not edit manually.
export const resources = ${JSON.stringify(bundles, null, 2)} as const;
export type AppResources = typeof resources;
export default resources;
`;
  } else if (format === "esm") {
    code = `// Auto-generated by LocL CLI (locl compile). Do not edit manually.
export const resources = ${JSON.stringify(bundles, null, 2)};
export default resources;
`;
  } else if (format === "cjs") {
    code = `// Auto-generated by LocL CLI (locl compile). Do not edit manually.
module.exports = ${JSON.stringify(bundles, null, 2)};
`;
  } else {
    code = JSON.stringify(bundles, null, 2) + "\n";
  }
  fs3.mkdirSync(path3.dirname(outPath), { recursive: true });
  fs3.writeFileSync(outPath, code, "utf8");
  return {
    outputFile: outPath,
    localesCount: Object.keys(bundles).length,
    keysCount: totalKeys
  };
}

// src/cli/status.ts
import fs4 from "fs";
import path4 from "path";
function getTranslationStatus(options = {}) {
  const localesDir = options.localesDir ?? "locales";
  const baseLang = options.baseLang ?? "en";
  const basePath = path4.join(localesDir, `${baseLang}.json`);
  if (!fs4.existsSync(basePath)) {
    throw new Error(`[LocL/status] Base language file not found: "${basePath}"`);
  }
  const baseContent = JSON.parse(fs4.readFileSync(basePath, "utf8"));
  const flatBase = flattenDictionary(baseContent);
  const baseKeys = Object.keys(flatBase);
  const totalKeys = baseKeys.length;
  const entries = fs4.readdirSync(localesDir).filter((f) => {
    if (!f.endsWith(".json")) {
      return false;
    }
    if (f === `${baseLang}.json`) {
      return false;
    }
    if (f.startsWith(".") || f.includes(".compiled.")) {
      return false;
    }
    return true;
  });
  const locales = {
    [baseLang]: {
      total: totalKeys,
      translated: totalKeys,
      missing: 0,
      percentage: 100
    }
  };
  for (const file of entries) {
    const lang = file.replace(/\.json$/, "");
    const targetPath = path4.join(localesDir, file);
    const targetContent = JSON.parse(fs4.readFileSync(targetPath, "utf8"));
    const flatTarget = flattenDictionary(targetContent);
    let translated = 0;
    for (const k of baseKeys) {
      if (flatTarget[k] !== void 0 && flatTarget[k] !== "") {
        translated++;
      }
    }
    const missing = totalKeys - translated;
    const percentage = totalKeys > 0 ? Math.round(translated / totalKeys * 100) : 100;
    locales[lang] = {
      total: totalKeys,
      translated,
      missing,
      percentage
    };
  }
  return {
    baseLang,
    totalKeys,
    locales
  };
}

// src/cli/index.ts
async function runCli(argv = process.argv.slice(2)) {
  const command = argv[0];
  if (!command || command === "--help" || command === "-h") {
    console.log(`
LocL.js CLI \u2014 Developer Tooling & Localization Pipeline

Usage:
  locl <command> [options]

Commands:
  extract    Scans source files (.ts, .tsx, .vue, .svelte) and syncs keys to JSON
  check      Verifies translation parity across secondary languages in CI
  status     Displays visual coverage matrix and percentage completion
  compile    Ahead-of-Time (AOT) compiles dictionaries into optimized bundles

Options:
  --src, -s        Source directory to scan (default: src, app, components)
  --locales, -l    Locales directory (default: locales)
  --base, -b       Base language code (default: en)
  --output, -o     Output file path
  --format, -f     Compilation format: ts | esm | cjs | json (default: ts)
  --fix            Auto-adds missing keys to secondary languages
  --strict         Fails if extraneous or empty keys are found
  --clean          Removes orphaned keys from translation file
  --dry-run        Runs extraction without writing to disk
  --flat           Generates single-level dot keys
  --version, -v    Displays version
`);
    return 0;
  }
  if (command === "--version" || command === "-v") {
    console.log("2.4.0");
    return 0;
  }
  const parseFlag = (name) => {
    const idx = argv.indexOf(name);
    return idx !== -1 && argv[idx + 1] ? argv[idx + 1] : void 0;
  };
  const hasFlag = (name) => argv.includes(name);
  const localesDir = parseFlag("--locales") || parseFlag("-l") || "locales";
  const baseLang = parseFlag("--base") || parseFlag("-b") || "en";
  const src = parseFlag("--src") || parseFlag("-s");
  const output = parseFlag("--output") || parseFlag("-o");
  const format = parseFlag("--format") || parseFlag("-f") || "ts";
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
        extensions: parseFlag("--ext") ? parseFlag("--ext").split(",").map((e) => e.trim().startsWith(".") ? e.trim() : `.${e.trim()}`) : void 0,
        defaultValue: parseFlag("--default") || parseFlag("--default-value")
      });
      console.log(`\u2714 [LocL] Extracted ${res.newKeysCount} new keys across ${res.filesScanned} files into "${res.outputFile}" (Total: ${res.totalKeysCount})`);
      return 0;
    }
    if (command === "check") {
      const res = checkTranslations({
        localesDir,
        baseLang,
        fix: hasFlag("--fix"),
        strict: hasFlag("--strict")
      });
      console.log(`
LocL Parity Report (Base: ${res.baseLang}, ${res.totalBaseKeys} keys):`);
      for (const [lang, info] of Object.entries(res.locales)) {
        const status = info.missing.length === 0 ? "\u2714 OK" : `\u2716 ${info.missing.length} missing`;
        console.log(`  \u2022 [${lang}] ${status} (${info.total} keys, ${info.extraneous.length} extra, ${info.empty.length} empty)`);
        if (info.missing.length > 0) {
          console.log(`    Missing: ${info.missing.slice(0, 5).join(", ")}${info.missing.length > 5 ? "..." : ""}`);
        }
      }
      if (!res.success) {
        console.error("\n\u274C [LocL] Parity check failed. Use --fix to automatically backfill missing keys.");
        return 1;
      }
      console.log("\n\u2714 [LocL] All language dictionaries are in parity.");
      return 0;
    }
    if (command === "status") {
      const res = getTranslationStatus({ localesDir, baseLang });
      console.log(`
LocL Translation Coverage (Base: ${res.baseLang}, ${res.totalKeys} keys):`);
      for (const [lang, stat] of Object.entries(res.locales)) {
        const bar = "\u2588".repeat(Math.floor(stat.percentage / 5)) + "\u2591".repeat(20 - Math.floor(stat.percentage / 5));
        console.log(`  \u2022 [${lang}] ${stat.percentage.toString().padStart(3)}% [${bar}] ${stat.translated}/${stat.total} keys (${stat.missing} missing)`);
      }
      return 0;
    }
    if (command === "compile") {
      const res = compileTranslations({
        localesDir,
        output,
        format
      });
      console.log(`\u2714 [LocL] Compiled ${res.localesCount} locales (${res.keysCount} keys) into "${res.outputFile}"`);
      return 0;
    }
    console.error(`[LocL] Unknown command: "${command}". Run "locl --help" for available commands.`);
    return 1;
  } catch (err) {
    console.error(`[LocL] Error: ${err.message}`);
    return 1;
  }
}

// src/cli/bin.ts
runCli().then((code) => {
  if (typeof code === "number") {
    process.exit(code);
  }
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
