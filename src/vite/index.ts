import fs from "node:fs";
import path from "node:path";

export interface LocLVitePluginOptions {
  localesDir?: string;
}

export function loclVitePlugin(options: LocLVitePluginOptions = {}) {
  const localesDir = options.localesDir ?? "locales";

  return {
    name: "locl-vite-plugin",
    handleHotUpdate({ file, server }: { file: string; server: any }) {
      const normalized = file.replace(/\\/g, "/");
      if (normalized.includes(localesDir) && normalized.endsWith(".json")) {
        const lang = path.basename(file, ".json");
        try {
          const content = JSON.parse(fs.readFileSync(file, "utf8"));
          server.ws.send({
            type: "custom",
            event: "locl:update",
            data: { lang, data: content }
          });
          return [];
        } catch {}
      }
    }
  };
}

export function setupLocLHmr(translator: any, hot: any): () => void {
  if (!hot || typeof hot.on !== "function") return () => {};
  const handler = ({ lang, data }: { lang: string; data: any }) => {
    if (translator && typeof translator.addResources === "function") {
      translator.addResources(lang, data);
    }
  };
  hot.on("locl:update", handler);
  return () => {
    if (typeof hot.off === "function") {
      hot.off("locl:update", handler);
    }
  };
}