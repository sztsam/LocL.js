// src/compat/index.ts
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
  const tFunction = (key, arg1, arg2) => {
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
  };
  const compat = {
    translator,
    t: tFunction,
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
      try {
        if (typeof translator.isLoaded === "function" && typeof translator.load === "function" && !translator.isLoaded(lng)) {
          await translator.load(lng);
        }
        translator.changeLanguage(lng);
        const current = translator.getLanguage();
        callback?.(null, compat.t.bind(compat));
        return current;
      } catch (err) {
        callback?.(err, compat.t.bind(compat));
        throw err;
      }
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
    addResourceBundle(lng, ns, resources) {
      translator.addResources(lng, { [ns]: resources });
    },
    hasResourceBundle(lng, ns) {
      return translator.isLoaded(lng, ns);
    },
    getResourceBundle(lng, ns) {
      const langObj = translator.resources?.[lng];
      return langObj?.[ns];
    },
    async loadNamespaces(ns, callback) {
      const list = Array.isArray(ns) ? ns : [ns];
      const currentLang = translator.getLanguage();
      await Promise.all(list.map((n) => translator.load(currentLang, n)));
      callback?.();
    }
  };
  return compat;
}
var createI18nextCompat = toI18next;
export {
  createI18nextCompat,
  toI18next
};
