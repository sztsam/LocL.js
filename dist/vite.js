// src/vite/index.ts
import fs from "fs";
import path from "path";
function loclVitePlugin(options = {}) {
  const localesDir = options.localesDir ?? "locales";
  return {
    name: "locl-vite-plugin",
    handleHotUpdate({ file, server }) {
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
        } catch {
        }
      }
    }
  };
}
function setupLocLHmr(translator, hot) {
  if (!hot || typeof hot.on !== "function") return () => {
  };
  const handler = ({ lang, data }) => {
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
export {
  loclVitePlugin,
  setupLocLHmr
};
