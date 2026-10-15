import fs from "node:fs";
import path from "node:path";

export interface ExtractOptions {
  /** Source directory or directories to scan (default: ["src", "app", "pages", "components"]) */
  src?: string | string[];
  /** File extensions to scan (default: [".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte"]) */
  extensions?: string[];
  /** Locales directory path (default: "locales") */
  localesDir?: string;
  /** Base language code (default: "en") */
  baseLang?: string;
  /** Output file override */
  outputFile?: string;
  /** Output flat keys instead of nested objects (default: false) */
  flat?: boolean;
  /** Sort keys alphabetically (default: true) */
  sort?: boolean;
  /** Default value generator */
  defaultValue?: string | ((key: string) => string);
  /** Dry run without writing to disk */
  dryRun?: boolean;
  /** Cleans unused localization pairs */
  clean?: boolean;
}

export interface ExtractResult {
  filesScanned: number;
  keysFound: string[];
  newKeysCount: number;
  totalKeysCount: number;
  outputFile: string;
}

const DEFAULT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte"];
const DEFAULT_SRC_DIRS = ["src", "app", "pages", "components"];

function collectFiles(dir: string, extensions: string[], results: string[] = []): string[] {
  if (!fs.existsSync(dir)) { return results; }
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

export function extractKeysFromContent(content: string): Array<{ key: string; defaultValue?: string }> {
  const results: Array<{ key: string; defaultValue?: string }> = [];
  const seen = new Set<string>();

  // Extract from t, tt, plural, ordinal, rich, get, and getObj
  const fnRegex = /\b(?:t|tt|plural|ordinal|rich|get|getObj)\s*\(\s*(['"`])([^'"`\r\n]+)\1(?:\s*,\s*(['"`])([^'"`\r\n]*)\3)?/g;
  let match: RegExpExecArray | null;

  while ((match = fnRegex.exec(content)) !== null) {
    const key = match[2];
    const defaultValue = match[4];
    if (key && !seen.has(key)) {
      seen.add(key);
      results.push({ key, defaultValue });
    }
  }

  // Extract from <Trans> and namespaced <suite.Trans> with fallback attribute support
  const transRegex = /<([a-zA-Z0-9_.]*Trans)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
  while ((match = transRegex.exec(content)) !== null) {
    const attrs = match[2];
    const keyMatch = attrs.match(/\bi18nKey=(?:(['"`])([^'"`\r\n]+)\1|\{\s*(['"`])([^'"`\r\n]+)\3\s*\})/);
    const fallbackMatch = attrs.match(/\bfallback=(?:(['"`])([^'"`\r\n]+)\1|\{\s*(['"`])([^'"`\r\n]+)\3\s*\})/);
    const key = keyMatch ? (keyMatch[2] || keyMatch[4]) : undefined;
    const defaultValue = fallbackMatch ? (fallbackMatch[2] || fallbackMatch[4]) : undefined;
    if (key && !seen.has(key)) {
      seen.add(key);
      results.push({ key, defaultValue });
    }
  }

  return results;
}

export function setNested(target: Record<string, any>, keyPath: string, value: any): void {
  const parts = keyPath.split(".");
  let cur = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (p === "__proto__" || p === "constructor" || p === "prototype") { return; }
    if (!cur[p] || typeof cur[p] !== "object") {
      cur[p] = {};
    }
    cur = cur[p];
  }
  const last = parts[parts.length - 1];
  if (last === "__proto__" || last === "constructor" || last === "prototype") { return; }
  if (cur[last] && typeof cur[last] === "object" && typeof value !== "object") { return; }
  cur[last] = value;
}

function sortObject(obj: Record<string, any>): Record<string, any> {
  const sorted: Record<string, any> = {};
  for (const k of Object.keys(obj).sort()) {
    sorted[k] = obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])
      ? sortObject(obj[k])
      : obj[k];
  }
  return sorted;
}

export function extractKeys(options: ExtractOptions = {}): ExtractResult {
  const extensions = options.extensions ?? DEFAULT_EXTENSIONS;
  const srcDirs = options.src
    ? (Array.isArray(options.src) ? options.src : [options.src])
    : DEFAULT_SRC_DIRS.filter((d) => fs.existsSync(d));

  if (srcDirs.length === 0) {
    srcDirs.push(".");
  }

  const files: string[] = [];
  for (const dir of srcDirs) {
    files.push(...collectFiles(dir, extensions));
  }

  const allFoundKeys: Array<{ key: string; defaultValue?: string }> = [];
  const seenKeys = new Set<string>();

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

  let currentJson: Record<string, any> = {};
  if (fs.existsSync(outPath) && !options.clean) {
    try {
      currentJson = JSON.parse(fs.readFileSync(outPath, "utf8"));
    } catch { }
  }

  let newKeysCount = 0;

  for (const item of allFoundKeys) {
    const val = item.defaultValue !== undefined
      ? item.defaultValue
      : typeof options.defaultValue === "function"
        ? options.defaultValue(item.key)
        : options.defaultValue ?? item.key;

    if (options.flat) {
      if (currentJson[item.key] === undefined) {
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
