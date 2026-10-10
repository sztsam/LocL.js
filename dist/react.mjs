// src/react/index.tsx
import { createContext, useContext as useContext2, useSyncExternalStore as useSyncExternalStore2, useMemo as useMemo2, useEffect } from "react";

// src/react/Trans.tsx
import React, { isValidElement, cloneElement, useContext, useMemo, useSyncExternalStore } from "react";
import { Fragment, jsx } from "react/jsx-runtime";
function Trans(props) {
  const {
    i18nKey,
    values,
    components = {},
    translator: customTranslator,
    scope,
    fallback
  } = props;
  const contextTranslator = useContext(LocLContext);
  const activeTranslator = customTranslator ?? contextTranslator;
  const getSnapshot = () => activeTranslator ? activeTranslator.getLanguage() : "";
  const language = useSyncExternalStore(
    (onStoreChange) => activeTranslator ? activeTranslator.subscribe(onStoreChange) : () => {
    },
    getSnapshot,
    getSnapshot
  );
  const scopeKey = Array.isArray(scope) ? scope.join("|") : scope;
  const scopedTranslator = useMemo(() => {
    if (!activeTranslator) return null;
    return scope !== void 0 ? activeTranslator.withConfig({ scope }) : activeTranslator;
  }, [activeTranslator, scopeKey, language]);
  const raw = useMemo(() => {
    if (!scopedTranslator) {
      return String(fallback ?? i18nKey);
    }
    const tInstance = scopedTranslator;
    const res = tInstance.t(i18nKey, values);
    const keyExists = tInstance.get(i18nKey) !== void 0;
    if (keyExists) {
      return String(res);
    }
    return String(fallback ?? i18nKey);
  }, [scopedTranslator, i18nKey, values, fallback, language]);
  const tagRegex = /<([a-zA-Z0-9_-]+)>([\s\S]*?)<\/\1>/g;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let counter = 0;
  while ((match = tagRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(raw.slice(lastIndex, match.index));
    }
    const tagName = match[1];
    const content = match[2];
    const component = components[tagName];
    if (isValidElement(component)) {
      nodes.push(
        cloneElement(component, { key: `trans-${tagName}-${counter++}` }, content)
      );
    } else if (typeof component === "function") {
      nodes.push(
        /* @__PURE__ */ jsx(React.Fragment, { children: component(content) }, `trans-${tagName}-${counter++}`)
      );
    } else {
      nodes.push(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < raw.length) {
    nodes.push(raw.slice(lastIndex));
  }
  return /* @__PURE__ */ jsx(Fragment, { children: nodes });
}

// src/react/index.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var LocLContext = createContext(null);
function LocLProvider({ translator, children }) {
  return /* @__PURE__ */ jsx2(LocLContext.Provider, { value: translator, children });
}
function useLocL(customTranslator) {
  const contextTranslator = useContext2(LocLContext);
  const translator = customTranslator ?? contextTranslator;
  if (!translator) {
    throw new Error("[LocL] `useLocL` must be used within a `<LocLProvider>`.");
  }
  const getVersion = () => translator.getVersion();
  useSyncExternalStore2(
    (onStoreChange) => translator.subscribe(onStoreChange),
    getVersion,
    getVersion
  );
  return {
    translator,
    language: translator.getLanguage(),
    changeLanguage: (lang) => translator.changeLanguage(lang),
    t: translator.t.bind(translator),
    plural: translator.plural.bind(translator),
    rich: translator.rich.bind(translator),
    format: translator.format.bind(translator)
  };
}
function useTranslation(scope, options, customTranslator) {
  const { translator, language, changeLanguage } = useLocL(customTranslator);
  const scopeKey = Array.isArray(scope) ? scope.join("|") : scope;
  const scopeStr = typeof scope === "string" ? scope : void 0;
  const isReady = translator.isLoaded(language, scopeStr);
  if (!isReady && options?.suspense) {
    throw translator.load(language, scopeStr, options.loader);
  }
  useEffect(() => {
    if (!isReady && !options?.suspense) {
      translator.load(language, scopeStr, options?.loader).catch((err) => {
        console.error(`[LocL] Failed to load translations for "${scopeStr}":`, err);
      });
    }
  }, [translator, language, scopeStr, isReady, options?.loader, options?.suspense]);
  const scopedTranslator = useMemo2(() => {
    return scope !== void 0 ? translator.withConfig({ scope }) : translator;
  }, [translator, scopeKey]);
  return {
    translator: scopedTranslator,
    language,
    changeLanguage,
    ready: isReady,
    t: scopedTranslator.t.bind(scopedTranslator),
    plural: scopedTranslator.plural.bind(scopedTranslator),
    rich: scopedTranslator.rich.bind(scopedTranslator),
    format: scopedTranslator.format.bind(scopedTranslator)
  };
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
    const getVersion = () => translator.getVersion();
    useSyncExternalStore2(
      (onStoreChange) => translator.subscribe(onStoreChange),
      getVersion,
      getVersion
    );
    return {
      translator,
      language: translator.getLanguage(),
      changeLanguage: (lang) => translator.changeLanguage(lang),
      t: translator.t.bind(translator),
      plural: translator.plural.bind(translator),
      rich: translator.rich.bind(translator),
      format: translator.format.bind(translator)
    };
  }
  function useBoundTranslation(scope, options, customTranslator) {
    const { translator, language, changeLanguage } = useBoundLocL(customTranslator);
    const scopeKey = Array.isArray(scope) ? scope.join("|") : scope;
    const scopeStr = typeof scope === "string" ? scope : void 0;
    const isReady = translator.isLoaded(language, scopeStr);
    if (!isReady && options?.suspense) {
      throw translator.load(language, scopeStr, options.loader);
    }
    useEffect(() => {
      if (!isReady && !options?.suspense) {
        translator.load(language, scopeStr, options?.loader).catch((err) => {
          console.error(`[LocL] Failed to load translations for "${scopeStr}":`, err);
        });
      }
    }, [translator, language, scopeStr, isReady, options?.loader, options?.suspense]);
    const scopedTranslator = useMemo2(() => {
      return scope !== void 0 ? translator.withConfig({ scope }) : translator;
    }, [translator, scopeKey]);
    return {
      translator: scopedTranslator,
      language,
      changeLanguage,
      ready: isReady,
      t: scopedTranslator.t.bind(scopedTranslator),
      plural: scopedTranslator.plural.bind(scopedTranslator),
      rich: scopedTranslator.rich.bind(scopedTranslator),
      format: scopedTranslator.format.bind(scopedTranslator)
    };
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
