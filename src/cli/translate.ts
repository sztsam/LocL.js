import fs from "node:fs";
import path from "node:path";
import { flattenDictionary, unflattenDictionary } from "../index.js";

export type TranslationProvider = "deepl" | "openai" | "google" | "ollama" | "custom";

export interface TranslateOptions {
  /** Target language code or list of language codes (e.g. "es", ["es", "de"]) */
  target: string | string[];
  /** Locales directory path (default: "locales") */
  localesDir?: string;
  /** Base language filename without extension (default: "en") */
  baseLang?: string;
  /** Translation provider service (default: "deepl") */
  provider?: TranslationProvider;
  /** Provider API key (defaults to environment variables) */
  apiKey?: string;
  /** Model name override (for OpenAI or Ollama) */
  model?: string;
  /** Ollama host URL (default: "http://localhost:11434") */
  ollamaHost?: string;
  /** Custom async translation function */
  customTranslator?: (texts: string[], from: string, to: string) => Promise<string[]>;
  /** Re-translate all keys even if already translated (default: false) */
  force?: boolean;
  /** Dry run without writing changes to disk */
  dryRun?: boolean;
  /** Maximum number of strings to send in a single batch request (default: 50) */
  batchSize?: number;
}

export interface TranslateLocaleReport {
  translated: number;
  skipped: number;
  total: number;
  file: string;
}

export interface TranslateResult {
  success: boolean;
  provider: string;
  baseLang: string;
  locales: Record<string, TranslateLocaleReport>;
}

export function maskTokens(text: string): { masked: string; tokens: string[] } {
  const tokens: string[] = [];
  // Masks {{var}}, {var | fmt}, and HTML/JSX tags <bold>...</bold>, <br />
  const tokenRegex = /(\{\{[^{}]+\}\}|\{[^{}]+\}|<\/?[a-zA-Z0-9_-]+(?:\s+[^<>]*)?\/?>)/g;
  const masked = text.replace(tokenRegex, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return `__LOCL_TOK_${idx}__`;
  });
  return { masked, tokens };
}

export function unmaskTokens(text: string, tokens: string[]): string {
  let unmasked = text;
  for (let i = 0; i < tokens.length; i++) {
    const pattern = new RegExp(`__\\s*LOCL_TOK_${i}\\s*__`, "gi");
    unmasked = unmasked.replace(pattern, tokens[i]);
  }
  return unmasked;
}

export async function translateBatchWithProvider(texts: string[], from: string, to: string, options: TranslateOptions): Promise<string[]> {
  if (texts.length === 0) { return []; }
  const provider = options.provider ?? "deepl";

  if (options.customTranslator) {
    return options.customTranslator(texts, from, to);
  }

  // --- DeepL Provider ---
  if (provider === "deepl") {
    const apiKey = options.apiKey || process.env.DEEPL_API_KEY;
    if (!apiKey) {
      throw new Error("[LocL/translate] Missing DeepL API key. Set DEEPL_API_KEY environment variable or pass --api-key.");
    }
    const endpoint = apiKey.endsWith(":fx")
      ? "https://api-free.deepl.com/v2/translate"
      : "https://api.deepl.com/v2/translate";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: texts,
        target_lang: to.toUpperCase(),
        source_lang: from.toUpperCase()
      })
    });
    if (!res.ok) {
      throw new Error(`[LocL/translate] DeepL API error: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    return json.translations.map((t: any) => t.text);
  }

  // --- OpenAI Provider ---
  if (provider === "openai") {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("[LocL/translate] Missing OpenAI API key. Set OPENAI_API_KEY environment variable or pass --api-key.");
    }
    const model = options.model || "gpt-4o-mini";

    const systemPrompt = `You are an expert localization engine. Translate the following JSON array of strings from ${from} to ${to}.
CRITICAL RULES:
1. Preserve all placeholders matching __LOCL_TOK_N__ EXACTLY without translating, deleting, or altering them.
2. Return ONLY a valid JSON array of strings corresponding 1:1 with the input array.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify({ strings: texts }) }
        ]
      })
    });
    if (!res.ok) {
      throw new Error(`[LocL/translate] OpenAI API error: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    const content = JSON.parse(json.choices[0].message.content);
    return content.strings || content.translations || Object.values(content)[0];
  }

  // --- Google Translate Provider ---
  if (provider === "google") {
    const apiKey = options.apiKey || process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      throw new Error("[LocL/translate] Missing Google Translate API key. Set GOOGLE_TRANSLATE_API_KEY or pass --api-key.");
    }
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: texts,
        source: from,
        target: to,
        format: "text"
      })
    });
    if (!res.ok) {
      throw new Error(`[LocL/translate] Google API error: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    return json.data.translations.map((t: any) => t.translatedText);
  }

  // --- Ollama Provider ---
  if (provider === "ollama") {
    const host = options.ollamaHost || process.env.OLLAMA_HOST || "http://localhost:11434";
    const model = options.model || "llama3";
    const prompt = `Translate this JSON array from ${from} to ${to}. Keep all __LOCL_TOK_N__ tokens unchanged. Return ONLY a JSON array of strings: ${JSON.stringify(texts)}`;

    const res = await fetch(`${host}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json"
      })
    });
    if (!res.ok) {
      throw new Error(`[LocL/translate] Ollama error: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    const parsed = JSON.parse(json.response);
    return Array.isArray(parsed) ? parsed : Object.values(parsed)[0] as string[];
  }

  throw new Error(`[LocL/translate] Unsupported provider "${provider}".`);
}

export async function translateTranslations(options: TranslateOptions): Promise<TranslateResult> {
  const localesDir = options.localesDir ?? "locales";
  const baseLang = options.baseLang ?? "en";
  const basePath = path.join(localesDir, `${baseLang}.json`);
  const batchSize = options.batchSize ?? 50;

  if (!fs.existsSync(basePath)) {
    throw new Error(`[LocL/translate] Base language file not found: "${basePath}"`);
  }

  const targets = Array.isArray(options.target)
    ? options.target
    : options.target.split(",").map((t) => t.trim()).filter(Boolean);

  if (targets.length === 0) {
    throw new Error("[LocL/translate] At least one target language must be specified (--target es,de).");
  }

  const baseContent = JSON.parse(fs.readFileSync(basePath, "utf8"));
  const flatBase = flattenDictionary(baseContent);
  const baseKeys = Object.keys(flatBase);

  const report: Record<string, TranslateLocaleReport> = {};

  for (const targetLang of targets) {
    if (targetLang === baseLang) { continue; }
    const targetPath = path.join(localesDir, `${targetLang}.json`);

    let flatTarget: Record<string, any> = {};
    let isOriginallyNested = true;

    if (fs.existsSync(targetPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(targetPath, "utf8"));
        isOriginallyNested = Object.values(raw).some((v) => v && typeof v === "object" && !Array.isArray(v));
        flatTarget = flattenDictionary(raw);
      } catch {}
    }

    const keysToTranslate = options.force
      ? baseKeys
      : baseKeys.filter((k) => flatTarget[k] === undefined || flatTarget[k] === "");

    if (keysToTranslate.length === 0) {
      report[targetLang] = {
        translated: 0,
        skipped: baseKeys.length,
        total: baseKeys.length,
        file: targetPath
      };
      continue;
    }

    // Process in batches with token preservation
    for (let i = 0; i < keysToTranslate.length; i += batchSize) {
      const batchKeys = keysToTranslate.slice(i, i + batchSize);
      const maskedBatch = batchKeys.map((k) => maskTokens(String(flatBase[k])));

      const translatedMasked = await translateBatchWithProvider(
        maskedBatch.map((m) => m.masked),
        baseLang,
        targetLang,
        options
      );

      for (let j = 0; j < batchKeys.length; j++) {
        const key = batchKeys[j];
        const tokens = maskedBatch[j].tokens;
        flatTarget[key] = unmaskTokens(translatedMasked[j], tokens);
      }
    }

    if (!options.dryRun) {
      const output = isOriginallyNested ? unflattenDictionary(flatTarget) : flatTarget;
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, JSON.stringify(output, null, 2) + "\n", "utf8");
    }

    report[targetLang] = {
      translated: keysToTranslate.length,
      skipped: baseKeys.length - keysToTranslate.length,
      total: baseKeys.length,
      file: targetPath
    };
  }

  return {
    success: true,
    provider: options.provider ?? "deepl",
    baseLang,
    locales: report
  };
}