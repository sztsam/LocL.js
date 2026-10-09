import React, { ReactNode, ReactElement, isValidElement, cloneElement, useContext, useMemo, useSyncExternalStore } from "react";
import { LocL } from "../LocL.js";
import { ScopeType, InterpolationOptions, NestedKeyOf, TranslationObjectFor, PluralKeys, ParamsFor, PathValue, IsEmptyParams } from "../types.js";
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
> = IsEmptyParams<ParamsFor<PathValue<TranslationObjectFor<S, T, Fallback>, K>>> extends true
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
 * Renders translated text with rich React component interpolation without `dangerouslySetInnerHTML`.
 * Subscribes reactively to language updates and supports strict type checking and autocompletion.
 * @example
 * ```tsx
 * <Trans
 *   i18nKey="agreement"
 *   values={{ name: "Alice" }}
 *   components={{
 *     bold: <strong />,
 *     link: (content) => <a href="/terms">{content}</a>
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
    components = {},
    translator: customTranslator,
    scope,
    fallback
  } = props;

  const contextTranslator = useContext(LocLContext);
  const activeTranslator = (customTranslator ?? contextTranslator) as LocL<T, Fallback, any, any, any> | null;

  const getSnapshot = () => (activeTranslator ? activeTranslator.getLanguage() : "");
  const language = useSyncExternalStore(
    (onStoreChange) => (activeTranslator ? activeTranslator.subscribe(onStoreChange) : () => {}),
    getSnapshot,
    getSnapshot
  );

  const scopeKey = Array.isArray(scope) ? scope.join("|") : scope;

  const scopedTranslator = useMemo<LocL<any, any, any> | null>(() => {
    if (!activeTranslator) return null;
    return scope !== undefined ? activeTranslator.withConfig({ scope } as any) : activeTranslator;
  }, [activeTranslator, scopeKey, language]);

  const raw: string = useMemo(() => {
    if (!scopedTranslator) {
      return String(fallback ?? i18nKey);
    }

    const tInstance = scopedTranslator as {
      t: (key: string, values?: any) => any;
      get: (key?: string) => any;
    };

    const res = tInstance.t(i18nKey as string, values);
    const keyExists = tInstance.get(i18nKey as string) !== undefined;

    if (keyExists) {
      return String(res);
    }

    return String(fallback ?? i18nKey);
  }, [scopedTranslator, i18nKey, values, fallback, language]);

  const tagRegex = /<([a-zA-Z0-9_-]+)>([\s\S]*?)<\/\1>/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
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
        <React.Fragment key={`trans-${tagName}-${counter++}`}>
          {component(content)}
        </React.Fragment>
      );
    } else {
      nodes.push(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    nodes.push(raw.slice(lastIndex));
  }

  return <>{nodes}</>;
}