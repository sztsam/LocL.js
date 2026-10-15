import fs from "node:fs";
import path from "node:path";
import { flattenDictionary } from "../index.js";

export interface StatusOptions {
  localesDir?: string;
  baseLang?: string;
}

export interface LocaleStatus {
  total: number;
  translated: number;
  missing: number;
  percentage: number;
}

export interface StatusResult {
  baseLang: string;
  totalKeys: number;
  locales: Record<string, LocaleStatus>;
}

export function getTranslationStatus(options: StatusOptions = {}): StatusResult {
  const localesDir = options.localesDir ?? "locales";
  const baseLang = options.baseLang ?? "en";
  const basePath = path.join(localesDir, `${baseLang}.json`);

  if (!fs.existsSync(basePath)) {
    throw new Error(`[LocL/status] Base language file not found: "${basePath}"`);
  }

  const baseContent = JSON.parse(fs.readFileSync(basePath, "utf8"));
  const flatBase = flattenDictionary(baseContent);
  const baseKeys = Object.keys(flatBase);
  const totalKeys = baseKeys.length;

  const entries = fs.readdirSync(localesDir).filter((f) => {
    if (!f.endsWith(".json")) { return false; }
    if (f === `${baseLang}.json`) { return false; }
    if (f.startsWith(".") || f.includes(".compiled.")) { return false; }
    return true;
  });

  const locales: Record<string, LocaleStatus> = {
    [baseLang]: {
      total: totalKeys,
      translated: totalKeys,
      missing: 0,
      percentage: 100
    }
  };

  for (const file of entries) {
    const lang = file.replace(/\.json$/, "");
    const targetPath = path.join(localesDir, file);
    const targetContent = JSON.parse(fs.readFileSync(targetPath, "utf8"));
    const flatTarget = flattenDictionary(targetContent);

    let translated = 0;
    for (const k of baseKeys) {
      if (flatTarget[k] !== undefined && flatTarget[k] !== "") {
        translated++;
      }
    }
    const missing = totalKeys - translated;
    const percentage = totalKeys > 0 ? Math.round((translated / totalKeys) * 100) : 100;

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