"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/vite/index.ts
var vite_exports = {};
__export(vite_exports, {
  loclVitePlugin: () => loclVitePlugin,
  setupLocLHmr: () => setupLocLHmr
});
module.exports = __toCommonJS(vite_exports);
var import_node_fs = __toESM(require("fs"), 1);
var import_node_path = __toESM(require("path"), 1);
function loclVitePlugin(options = {}) {
  const localesDir = options.localesDir ?? "locales";
  return {
    name: "locl-vite-plugin",
    handleHotUpdate({ file, server }) {
      const normalized = file.replace(/\\/g, "/");
      if (normalized.includes(localesDir) && normalized.endsWith(".json")) {
        const lang = import_node_path.default.basename(file, ".json");
        try {
          const content = JSON.parse(import_node_fs.default.readFileSync(file, "utf8"));
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  loclVitePlugin,
  setupLocLHmr
});
