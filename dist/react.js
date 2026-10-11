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

// src/react/index.tsx
var react_exports = {};
__export(react_exports, {
  LocLContext: () => LocLContext,
  LocLProvider: () => LocLProvider,
  Trans: () => Trans,
  createLocLReact: () => createLocLReact,
  useLocL: () => useLocL,
  useTranslation: () => useTranslation
});
module.exports = __toCommonJS(react_exports);
var import_react2 = require("react");

// src/react/Trans.tsx
var import_react = __toESM(require("react"));
var import_jsx_runtime = require("react/jsx-runtime");
function renderNodes(rawText, components = {}) {
  const tagRegex = /<([a-zA-Z0-9_-]+)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9_-]+)\s*\/>/g;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let counter = 0;
  while ((match = tagRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(rawText.slice(lastIndex, match.index));
    }
    const isSelfClosing = match[3] !== void 0;
    const tagName = isSelfClosing ? match[3] : match[1];
    const rawContent = isSelfClosing ? void 0 : match[2];
    const component = components[tagName];
    const key = `trans-${tagName}-${counter++}`;
    if (component !== void 0) {
      const children = rawContent !== void 0 ? rawContent.includes("<") ? renderNodes(rawContent, components) : rawContent : void 0;
      if ((0, import_react.isValidElement)(component)) {
        nodes.push(
          children !== void 0 ? (0, import_react.cloneElement)(component, { key }, children) : (0, import_react.cloneElement)(component, { key })
        );
      } else if (typeof component === "function") {
        nodes.push(
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.default.Fragment, { children: component(children ?? "") }, key)
        );
      } else {
        nodes.push(match[0]);
      }
    } else {
      nodes.push(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < rawText.length) {
    nodes.push(rawText.slice(lastIndex));
  }
  return nodes;
}
function Trans(props) {
  const {
    i18nKey,
    values,
    components,
    translator: customTranslator,
    scope,
    fallback
  } = props;
  const contextTranslator = (0, import_react.useContext)(LocLContext);
  const activeTranslator = customTranslator ?? contextTranslator;
  const getSnapshot = () => {
    if (!activeTranslator) {
      return "";
    }
    return typeof activeTranslator.getVersion === "function" ? activeTranslator.getVersion() : activeTranslator.getLanguage?.() || "";
  };
  const version = (0, import_react.useSyncExternalStore)(
    (onStoreChange) => activeTranslator ? activeTranslator.subscribe(onStoreChange) : () => {
    },
    getSnapshot,
    getSnapshot
  );
  const scopeKey = Array.isArray(scope) ? scope.join("|") : scope;
  const scopedTranslator = (0, import_react.useMemo)(() => {
    if (!activeTranslator) {
      return null;
    }
    return scope !== void 0 ? activeTranslator.withConfig({ scope }) : activeTranslator;
  }, [activeTranslator, scopeKey]);
  const raw = (0, import_react.useMemo)(() => {
    if (!scopedTranslator) {
      return String(fallback ?? i18nKey);
    }
    const tInstance = scopedTranslator;
    const res = tInstance.t(i18nKey, values);
    if (res !== i18nKey && res !== void 0) {
      return String(res);
    }
    const keyExists = tInstance.get(i18nKey) !== void 0 || tInstance.get(`${i18nKey}_other`) !== void 0;
    if (keyExists) {
      return String(res);
    }
    return String(fallback ?? i18nKey);
  }, [scopedTranslator, i18nKey, values, fallback, version]);
  const nodes = (0, import_react.useMemo)(() => {
    return renderNodes(raw, components);
  }, [raw, components]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: nodes });
}

// src/react/index.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var LocLContext = (0, import_react2.createContext)(null);
function bindApi(translator) {
  return {
    t: translator.t.bind(translator),
    tt: translator.tt.bind(translator),
    plural: translator.plural.bind(translator),
    rich: translator.rich.bind(translator),
    format: translator.format.bind(translator),
    get: translator.get.bind(translator),
    getObj: translator.getObj.bind(translator)
  };
}
function useTranslatorSubscription(translator) {
  const getSnapshot = () => typeof translator.getVersion === "function" ? translator.getVersion() : translator.getLanguage?.() || "";
  (0, import_react2.useSyncExternalStore)(
    (onStoreChange) => translator.subscribe(onStoreChange),
    getSnapshot,
    getSnapshot
  );
}
function toResult(translator) {
  return {
    translator,
    language: translator.getLanguage(),
    changeLanguage: (lang) => translator.changeLanguage(lang),
    getLanguage: () => translator.getLanguage(),
    ...bindApi(translator)
  };
}
function useScopedTranslation(base, scope, options) {
  const { translator, language } = base;
  const scopeKey = Array.isArray(scope) ? scope.join("|") : scope;
  const scopeStr = typeof scope === "string" ? scope : void 0;
  const isReady = translator.isLoaded(language, scopeStr);
  if (!isReady && options?.suspense) {
    throw translator.load(language, scopeStr, options.loader);
  }
  (0, import_react2.useEffect)(() => {
    if (!isReady && !options?.suspense) {
      translator.load(language, scopeStr, options?.loader).catch((err) => {
        console.error(`[LocL] Failed to load translations for "${scopeStr}":`, err);
      });
    }
  }, [translator, language, scopeStr, isReady, options?.loader, options?.suspense]);
  const scopedTranslator = (0, import_react2.useMemo)(() => {
    return scope !== void 0 ? translator.withConfig({ scope }) : translator;
  }, [translator, scopeKey]);
  return {
    ...toResult(scopedTranslator),
    ready: isReady
  };
}
function LocLProvider({ translator, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(LocLContext.Provider, { value: translator, children });
}
function useLocL(customTranslator) {
  const contextTranslator = (0, import_react2.useContext)(LocLContext);
  const translator = customTranslator ?? contextTranslator;
  if (!translator) {
    throw new Error("[LocL] `useLocL` must be used within a `<LocLProvider>`.");
  }
  useTranslatorSubscription(translator);
  return toResult(translator);
}
function useTranslation(scope, options, customTranslator) {
  const base = useLocL(customTranslator);
  return useScopedTranslation(base, scope, options);
}
function createLocLReact(defaultTranslator) {
  const BoundContext = (0, import_react2.createContext)(null);
  function BoundLocLProvider({
    translator = defaultTranslator,
    children
  }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(LocLContext.Provider, { value: translator, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(BoundContext.Provider, { value: translator, children }) });
  }
  function useBoundLocL(customTranslator) {
    const contextTranslator = (0, import_react2.useContext)(BoundContext);
    const translator = customTranslator ?? contextTranslator ?? defaultTranslator;
    useTranslatorSubscription(translator);
    return toResult(translator);
  }
  function useBoundTranslation(scope, options, customTranslator) {
    const base = useBoundLocL(customTranslator);
    return useScopedTranslation(base, scope, options);
  }
  function BoundTrans(props) {
    const contextTranslator = (0, import_react2.useContext)(BoundContext);
    const activeTranslator = props.translator ?? contextTranslator ?? defaultTranslator;
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      Trans,
      {
        ...props,
        translator: activeTranslator
      }
    );
  }
  return {
    LocLContext: BoundContext,
    LocLProvider: BoundLocLProvider,
    useLocL: useBoundLocL,
    useTranslation: useBoundTranslation,
    Trans: BoundTrans,
    translator: defaultTranslator
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LocLContext,
  LocLProvider,
  Trans,
  createLocLReact,
  useLocL,
  useTranslation
});
