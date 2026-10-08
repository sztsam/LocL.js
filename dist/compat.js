"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/compat/index.ts
var compat_exports = {};
__export(compat_exports, {
  createI18nextCompat: () => createI18nextCompat,
  toI18next: () => toI18next
});
module.exports = __toCommonJS(compat_exports);
function toI18next(translator) {
  const listeners = {};
  const emit = (event, ...args) => {
    listeners[event]?.forEach((cb) => {
      try {
        cb(...args);
      } catch (err) {
        console.error(`[LocL/compat] Error in event "${event}":`, err);
      }
    });
  };
  translator.subscribe((newLang, prevLang) => {
    emit("languageChanged", newLang, prevLang);
  });
  const compat = {
    translator,
    t(key, arg1, arg2) {
      let defaultValue;
      let options = {};
      if (typeof arg1 === "string") {
        defaultValue = arg1;
        options = typeof arg2 === "object" && arg2 !== null ? arg2 : {};
      } else if (typeof arg1 === "object" && arg1 !== null) {
        options = arg1;
        defaultValue = options.defaultValue;
      }
      let lookupKey = key;
      let ns = options.ns;
      if (key.includes(":")) {
        const colonIdx = key.indexOf(":");
        ns = key.slice(0, colonIdx);
        lookupKey = key.slice(colonIdx + 1);
      }
      let activeTranslator = translator;
      if (ns) {
        activeTranslator = translator.withConfig({ scope: ns });
      }
      let result;
      if (typeof options.count === "number") {
        result = activeTranslator.plural(lookupKey, options);
      } else {
        result = activeTranslator.t(lookupKey, options);
      }
      const keyExists = activeTranslator.get(lookupKey) !== void 0 || result !== lookupKey;
      if (!keyExists && defaultValue !== void 0) {
        return defaultValue;
      }
      return result ?? defaultValue ?? key;
    },
    exists(key, options) {
      let lookupKey = key;
      let ns = options?.ns;
      if (key.includes(":")) {
        const colonIdx = key.indexOf(":");
        ns = key.slice(0, colonIdx);
        lookupKey = key.slice(colonIdx + 1);
      }
      const activeTranslator = ns ? translator.withConfig({ scope: ns }) : translator;
      return activeTranslator.get(lookupKey) !== void 0;
    },
    get language() {
      return translator.getLanguage();
    },
    get languages() {
      return Object.keys(translator.resources ?? {});
    },
    async changeLanguage(lng, callback) {
      translator.changeLanguage(lng);
      const current = translator.getLanguage();
      callback?.(null, compat.t.bind(compat));
      return current;
    },
    on(event, listener) {
      listeners[event] ?? (listeners[event] = /* @__PURE__ */ new Set());
      listeners[event].add(listener);
      return () => {
        listeners[event]?.delete(listener);
      };
    },
    off(event, listener) {
      listeners[event]?.delete(listener);
    },
    addResource(lng, ns, key, value) {
      translator.addResource(lng, `${ns}.${key}`, value);
    },
    addResources(lng, ns, resources) {
      translator.addResources(lng, { [ns]: resources });
    },
    addResourceBundle(lng, ns, resources, deep, overwrite) {
      translator.addResources(lng, { [ns]: resources });
    },
    hasResourceBundle(lng, ns) {
      const langObj = translator.resources?.[lng];
      return langObj?.[ns] !== void 0;
    },
    getResourceBundle(lng, ns) {
      const langObj = translator.resources?.[lng];
      return langObj?.[ns];
    },
    async loadNamespaces(ns, callback) {
      callback?.();
    }
  };
  return compat;
}
var createI18nextCompat = toI18next;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createI18nextCompat,
  toI18next
});
