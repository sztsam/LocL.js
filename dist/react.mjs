// src/react/index.tsx
import { createContext, useContext as useContext2, useSyncExternalStore as useSyncExternalStore2, useMemo as useMemo2, useEffect } from "react";

// src/react/Trans.tsx
import React, { isValidElement, cloneElement, useContext, useMemo, useSyncExternalStore } from "react";
import { Fragment, jsx } from "react/jsx-runtime";
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
      if (isValidElement(component)) {
        nodes.push(
          children !== void 0 ? cloneElement(component, { key }, children) : cloneElement(component, { key })
        );
      } else if (typeof component === "function") {
        nodes.push(
          /* @__PURE__ */ jsx(React.Fragment, { children: component(children ?? "") }, key)
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
  const contextTranslator = useContext(LocLContext);
  const activeTranslator = customTranslator ?? contextTranslator;
  const getSnapshot = () => {
    if (!activeTranslator) {
      return "";
    }
    return typeof activeTranslator.getVersion === "function" ? activeTranslator.getVersion() : activeTranslator.getLanguage?.() || "";
  };
  const version = useSyncExternalStore(
    (onStoreChange) => activeTranslator ? activeTranslator.subscribe(onStoreChange) : () => {
    },
    getSnapshot,
    getSnapshot
  );
  const scopeKey = Array.isArray(scope) ? scope.join("|") : scope;
  const scopedTranslator = useMemo(() => {
    if (!activeTranslator) {
      return null;
    }
    return scope !== void 0 ? activeTranslator.withConfig({ scope }) : activeTranslator;
  }, [activeTranslator, scopeKey]);
  const raw = useMemo(() => {
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
  const nodes = useMemo(() => {
    return renderNodes(raw, components);
  }, [raw, components]);
  return /* @__PURE__ */ jsx(Fragment, { children: nodes });
}

// src/react/index.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var LocLContext = createContext(null);
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
  useSyncExternalStore2(
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
var SUSPENSE_FAILURE_TTL_MS = 2e3;
var suspenseLoads = /* @__PURE__ */ new WeakMap();
function suspendUntilLoaded(translator, language, scopes, loader) {
  const root = translator.rootInstance ?? translator;
  let loads = suspenseLoads.get(root);
  if (!loads) {
    loads = /* @__PURE__ */ new Map();
    suspenseLoads.set(root, loads);
  }
  for (const s of scopes) {
    const key = `${language}::${s ?? "*"}`;
    const state = loads.get(key);
    if (state && state.status === "failed") {
      if (Date.now() - state.failedAt < SUSPENSE_FAILURE_TTL_MS) {
        throw state.error;
      }
      loads.delete(key);
    }
  }
  const promises = [];
  for (const s of scopes) {
    if (translator.isLoaded(language, s)) {
      continue;
    }
    const key = `${language}::${s ?? "*"}`;
    const state = loads.get(key);
    if (state && state.status === "pending") {
      promises.push(state.promise);
      continue;
    }
    const loadPromise = translator.load(language, s, loader).then(
      () => {
        if (loads.get(key)?.status === "pending") {
          loads.delete(key);
        }
      },
      (error) => {
        loads.set(key, {
          status: "failed",
          error: error ?? new Error(`[LocL] Failed to load translations for "${language}"${s ? ` ("${s}")` : ""}.`),
          failedAt: Date.now()
        });
      }
    );
    loads.set(key, { status: "pending", promise: loadPromise });
    promises.push(loadPromise);
  }
  throw Promise.all(promises);
}
function useScopedTranslation(base, scope, options) {
  const { translator, language } = base;
  const scopeKey = Array.isArray(scope) ? scope.join("|") : scope;
  const scopes = Array.isArray(scope) ? scope : typeof scope === "string" ? [scope] : [void 0];
  const isReady = scopes.every((s) => translator.isLoaded(language, s));
  if (!isReady && options?.suspense) {
    suspendUntilLoaded(translator, language, scopes, options.loader);
  }
  useEffect(() => {
    if (!isReady && !options?.suspense) {
      const pendingScopes = scopes.filter((s) => !translator.isLoaded(language, s));
      if (pendingScopes.length > 0) {
        Promise.all(pendingScopes.map((s) => translator.load(language, s, options?.loader))).catch((err) => {
          console.error(`[LocL] Failed to load translations for "${scopeKey}":`, err);
        });
      }
    }
  }, [translator, language, scopeKey, isReady, options?.loader, options?.suspense]);
  const scopedTranslator = useMemo2(() => {
    return scope !== void 0 ? translator.withConfig({ scope }) : translator;
  }, [translator, scopeKey]);
  return {
    ...toResult(scopedTranslator),
    ready: isReady
  };
}
function LocLProvider({ translator, children }) {
  return /* @__PURE__ */ jsx2(LocLContext.Provider, { value: translator, children });
}
function useLocL(customTranslator) {
  const contextTranslator = useContext2(LocLContext);
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
  const BoundContext = createContext(null);
  function BoundLocLProvider({
    translator = defaultTranslator,
    children
  }) {
    return /* @__PURE__ */ jsx2(LocLContext.Provider, { value: translator, children: /* @__PURE__ */ jsx2(BoundContext.Provider, { value: translator, children }) });
  }
  function useBoundLocL(customTranslator) {
    const contextTranslator = useContext2(BoundContext);
    const translator = customTranslator ?? contextTranslator ?? defaultTranslator;
    useTranslatorSubscription(translator);
    return toResult(translator);
  }
  function useBoundTranslation(scope, options, customTranslator) {
    const base = useBoundLocL(customTranslator);
    return useScopedTranslation(base, scope, options);
  }
  function BoundTrans(props) {
    const contextTranslator = useContext2(BoundContext);
    const activeTranslator = props.translator ?? contextTranslator ?? defaultTranslator;
    return /* @__PURE__ */ jsx2(
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
export {
  LocLContext,
  LocLProvider,
  Trans,
  createLocLReact,
  useLocL,
  useTranslation
};
