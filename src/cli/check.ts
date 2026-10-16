import fs from "node:fs";
import path from "node:path";
import { flattenDictionary, unflattenDictionary } from "../index.js";

export interface ParamMismatch {
  key: string;
  baseParams: string[];
  targetParams: string[];
}
export interface TagMismatch {
  key: string;
  baseTags: string[];
  targetTags: string[];
}

export interface CheckOptions {
  /** Locales directory path (default: "locales") */
  localesDir?: string;
  /** Base language filename without extension (default: "en") */
  baseLang?: string;
  /** Automatically add missing keys from base language into target languages */
  fix?: boolean;
  /** Fail on any extraneous keys in secondary files */
  strict?: boolean;
  /** Fail if translation parameters or tags mismatch between base and target */
  lintParams?: boolean;
}

export interface CheckLocaleResult {
  missing: string[];
  extraneous: string[];
  empty: string[];
  total: number;
  fixed?: number;
  paramMismatches?: ParamMismatch[];
  tagMismatches?: TagMismatch[];
}

export interface CheckResult {
  success: boolean;
  baseLang: string;
  totalBaseKeys: number;
  locales: Record<string, CheckLocaleResult>;
}

function extractTemplateTokens(str: any): string[] {
  if (typeof str !== "string") { return []; }
  const matches = str.match(/\{+([^{}|,]+)(?:[^{}]*)\}+/g);
  if (!matches) { return []; }
  return Array.from(new Set(matches.map((m) => m.replace(/^[{}]+|[{}]+$/g, "").split(/[,|]/)[0].trim()))).sort();
}
function extractXmlTags(str: any): string[] {
  if (typeof str !== "string") { return []; }
  const matches = str.match(/<\/?[a-zA-Z0-9_-]+(?:\s+[^>]*)?\/?>/g);
  if (!matches) { return []; }
  return Array.from(new Set(matches.map((t) => t.replace(/\s+[^>]*\/?/, "").replace(/[<>/]/g, "")))).sort();
}

export function checkTranslations(options: CheckOptions = {}): CheckResult {
  const localesDir = options.localesDir ?? "locales";
  const baseLang = options.baseLang ?? "en";
  const basePath = path.join(localesDir, `${baseLang}.json`);

  if (!fs.existsSync(basePath)) {
    throw new Error(`[LocL/check] Base language file not found: "${basePath}"`);
  }

  const baseContent = JSON.parse(fs.readFileSync(basePath, "utf8"));
  const flatBase = flattenDictionary(baseContent);
  const baseKeys = Object.keys(flatBase);

  const entries = fs.readdirSync(localesDir).filter((f) => {
    if (!f.endsWith(".json")) { return false; }
    if (f === `${baseLang}.json`) { return false; }
    if (f.startsWith(".") || f.includes(".compiled.")) { return false; }
    return true;
  });
  const locales: Record<string, CheckLocaleResult> = {};
  let overallSuccess = true;

  for (const file of entries) {
    const lang = file.replace(/\.json$/, "");
    const targetPath = path.join(localesDir, file);
    const targetContent = JSON.parse(fs.readFileSync(targetPath, "utf8"));
    const flatTarget = flattenDictionary(targetContent);

    const missing = baseKeys.filter((k) => flatTarget[k] === undefined);
    const extraneous = Object.keys(flatTarget).filter((k) => flatBase[k] === undefined);
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
      fs.writeFileSync(targetPath, JSON.stringify(fixedOutput, null, 2) + "\n", "utf8");
      fixedCount = missing.length;
    }
    
    const paramMismatches: ParamMismatch[] = [];
    const tagMismatches: TagMismatch[] = [];

    for (const k of baseKeys) {
      const baseParams = extractTemplateTokens(flatBase[k]);
      const targetParams = extractTemplateTokens(flatTarget[k]);
      if (baseParams.join(",") !== targetParams.join(",")) {
        paramMismatches.push({ key: k, baseParams, targetParams });
      }

      const baseTags = extractXmlTags(flatBase[k]);
      const targetTags = extractXmlTags(flatTarget[k]);
      if (baseTags.join(",") !== targetTags.join(",")) {
        tagMismatches.push({ key: k, baseTags, targetTags });
      }
    }

    if (missing.length > 0 && !options.fix) {
      overallSuccess = false;
    }
    if (options.strict && (extraneous.length > 0 || empty.length > 0)) {
      overallSuccess = false;
    }
    if (options.lintParams && (paramMismatches.length > 0 || tagMismatches.length > 0)) {
      overallSuccess = false;
    }

    locales[lang] = {
      missing: options.fix ? [] : missing,
      extraneous,
      empty,
      total: Object.keys(flatTarget).length,
      fixed: fixedCount,
      paramMismatches,
      tagMismatches
    };
  }

  return {
    success: overallSuccess,
    baseLang,
    totalBaseKeys: baseKeys.length,
    locales
  };
}
