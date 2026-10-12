import React, { ReactNode, ReactElement, isValidElement, cloneElement, useContext, useMemo, useSyncExternalStore } from "react";
import { LocL } from "../LocL.js";
import { ScopeType, InterpolationOptions, NestedKeyOf, TranslationObjectFor, PluralKeys, ParamsFor, PathValue, IsEmptyParams, PluralParamsFor } from "../types.js";
import { LocLContext, type DefaultResources, type DefaultFallback } from "./index.js";

export type TransKey<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>,
  S extends ScopeType<T, Fallback> = undefined
> = (NestedKeyOf<TranslationObjectFor<S, T, Fallback>> | PluralKeys<S, T, Fallback>) & string;

export type TransValues<
  T extends Record<string, any>,
  Fallback extends keyof T & string,
  S extends ScopeType<T, Fallback>,
  K extends string
> = K extends PluralKeys<S, T, Fallback>
  ? PluralParamsFor<K, TranslationObjectFor<S, T, Fallback>>
  : IsEmptyParams<ParamsFor<PathValue<TranslationObjectFor<S, T, Fallback>, K>>> extends true
    ? InterpolationOptions | undefined
    : ParamsFor<PathValue<TranslationObjectFor<S, T, Fallback>, K>> & InterpolationOptions;

export type TransProps<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>,
  S extends ScopeType<T, Fallback> = undefined,
  K extends TransKey<T, Fallback, S> = TransKey<T, Fallback, S>
> =
  | {
      /** Strictly typed translation key */
      i18nKey: K;
      values?: TransValues<T, Fallback, S, K>;
      components?: Record<string, ReactElement | ((content: ReactNode) => ReactNode)>;
      translator?: LocL<T, any, any, any, any>;
      scope?: S;
      fallback?: string;
    }
  | {
      /** Dynamic / fallback key allowed ONLY when fallback string is provided */
      i18nKey: K | (string & {});
      values?: InterpolationOptions;
      components?: Record<string, ReactElement | ((content: ReactNode) => ReactNode)>;
      translator?: LocL<T, any, any, any, any>;
      scope?: S;
      fallback: string;
    };


/**
 * Parses and renders text with matched components (supporting nested and self-closing tags).
 */
function renderNodes(
  rawText: string,
  components: Record<string, ReactElement | ((content: ReactNode) => ReactNode)> = {}
): ReactNode[] {
  // Matches paired <tag>content</tag> OR self-closing <tag/> / <tag />
  const tagRegex = /<([a-zA-Z0-9_-]+)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9_-]+)\s*\/>/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let counter = 0;

  while ((match = tagRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(rawText.slice(lastIndex, match.index));
    }

    const isSelfClosing = match[3] !== undefined;
    const tagName = isSelfClosing ? match[3] : match[1];
    const rawContent = isSelfClosing ? undefined : match[2];
    const component = components[tagName];
    const key = `trans-${tagName}-${counter++}`;

    if (component !== undefined) {
      // Recursively parse nested tags inside paired elements
      const children: ReactNode = rawContent !== undefined
        ? (rawContent.includes("<") ? renderNodes(rawContent, components) : rawContent)
        : undefined;

      if (isValidElement(component)) {
        nodes.push(
          children !== undefined
            ? cloneElement(component, { key }, children)
            : cloneElement(component, { key })
        );
      } else if (typeof component === "function") {
        nodes.push(
          <React.Fragment key={key}>
            {component(children ?? "")}
          </React.Fragment>
        );
      } else {
        nodes.push(match[0]);
      }
    } else {
      // Unrecognized tag: preserve literal text
      nodes.push(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < rawText.length) {
    nodes.push(rawText.slice(lastIndex));
  }

  return nodes;
}

/**
 * Renders translated text with rich React component interpolation without `dangerouslySetInnerHTML`.
 * Subscribes reactively to language updates and supports strict type checking and autocompletion.
 * 
 * @example
 * ```tsx
 * <Trans
 *   i18nKey="agreement"
 *   values={{ name: "Alice" }}
 *   components={{
 *     bold: <strong />,
 *     link: (content) => <a href="/terms">{content}</a>,
 *     br: <br />
 *   }}
 * />
 * ```
 */
export function Trans<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>,
  S extends ScopeType<T, Fallback> = undefined,
  K extends TransKey<T, Fallback, S> = TransKey<T, Fallback, S>
>(props: TransProps<T, Fallback, S, K>): ReactElement {
  const {
    i18nKey,
    values,
    components,
    translator: customTranslator,
    scope,
    fallback
  } = props;

  const contextTranslator = useContext(LocLContext);
  const activeTranslator = (customTranslator ?? contextTranslator) as LocL<T, Fallback, any, any, any> | null;

  const getSnapshot = () => {
    if (!activeTranslator) { return ""; }
    return typeof activeTranslator.getVersion === "function"
      ? activeTranslator.getVersion()
      : (activeTranslator.getLanguage?.() || "");
  };
  const version = useSyncExternalStore(
    (onStoreChange) => (activeTranslator ? activeTranslator.subscribe(onStoreChange) : () => {}),
    getSnapshot,
    getSnapshot
  );

  const scopeKey = Array.isArray(scope) ? scope.join("|") : scope;

  const scopedTranslator = useMemo<LocL<T, Fallback, S> | null>(() => {
    if (!activeTranslator) { return null; }
    return (scope !== undefined
      ? activeTranslator.withConfig({ scope } as any)
      : activeTranslator) as LocL<T, Fallback, S>;
  }, [activeTranslator, scopeKey]);

  const raw: string = useMemo(() => {
    if (!scopedTranslator) {
      return String(fallback ?? i18nKey);
    }
    const tInstance = scopedTranslator as {
      t: (key: string, values?: any) => any;
      get: (key?: string) => any;
    };

    const res = tInstance.t(i18nKey as string, values);

    // If key resolved to a different string value, translation succeeded
    if (res !== i18nKey && res !== undefined) {
      return String(res);
    }
    // Verify key existence (checking both regular key and suffix plural `_other`)
    const keyExists =
      tInstance.get(i18nKey as string) !== undefined ||
      tInstance.get(`${i18nKey as string}_other`) !== undefined;

    if (keyExists) {
      return String(res);
    }

    return String(fallback ?? i18nKey);
  }, [scopedTranslator, i18nKey, values, fallback, version]);

  const nodes = useMemo(() => {
    return renderNodes(raw, components);
  }, [raw, components]);

  return <>{nodes}</>;
}