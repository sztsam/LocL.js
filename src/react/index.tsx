import React, { createContext, useContext, useSyncExternalStore, ReactNode, ReactElement, useMemo, useEffect } from "react";
import { LocL } from "../LocL.js";
import { ScopeType, Language, Scope, ResourceLoader } from "../types.js";
import { Trans, type TransProps, type TransKey, type TransValues } from "./Trans.js";

export { Trans, type TransProps, type TransKey, type TransValues };

/* =========================================================================
 * Global Type Registry
 * ========================================================================= */
/**
 * Global type registry for LocL React.
 * Augment this interface in user application code for zero-boilerplate,
 * 100% type-safe autocompletion across all hooks and components:
 *
 * @example
 * ```ts
 * declare module "locl-js/react" {
 *   interface LocLRegister {
 *     translator: typeof translator;
 *   }
 * }
 * ```
 */
export interface LocLRegister {}

export type DefaultResources = LocLRegister extends { translator: LocL<infer Res, any, any, any, any> }
  ? Res
  : LocLRegister extends { resources: infer Res extends Record<string, any> }
    ? Res
    : Record<string, any>;

export type DefaultFallback<T = DefaultResources> = LocLRegister extends { translator: LocL<any, infer FB, any, any, any> }
  ? FB
  : LocLRegister extends { fallbackLanguage: infer FB extends string }
    ? FB
    : [keyof T & string] extends [never]
      ? string
      : keyof T & string;

export const LocLContext = createContext<LocL<any, any, any, any, any> | null>(null);

/* =========================================================================
 * Shared Internals
 * ========================================================================= */

export type TranslatorApi<
  T extends Record<string, any>,
  Fallback extends keyof T & string,
  S extends ScopeType<T, Fallback>
> = Pick<LocL<T, Fallback, S>, "t" | "tt" | "plural" | "rich" | "format" | "get" | "getObj">;

function bindApi<
  T extends Record<string, any>,
  Fallback extends keyof T & string,
  S extends ScopeType<T, Fallback>
>(translator: LocL<T, Fallback, S, any, any>): TranslatorApi<T, Fallback, S> {
  return {
    t: translator.t.bind(translator) as LocL<T, Fallback, S>["t"],
    tt: translator.tt.bind(translator) as LocL<T, Fallback, S>["tt"],
    plural: translator.plural.bind(translator) as LocL<T, Fallback, S>["plural"],
    rich: translator.rich.bind(translator) as LocL<T, Fallback, S>["rich"],
    format: translator.format.bind(translator) as LocL<T, Fallback, S>["format"],
    get: translator.get.bind(translator) as LocL<T, Fallback, S>["get"],
    getObj: translator.getObj.bind(translator) as LocL<T, Fallback, S>["getObj"]
  };
}

function useTranslatorSubscription(translator: LocL<any, any, any, any, any>): void {
  const getSnapshot = () =>
    typeof translator.getVersion === "function"
      ? translator.getVersion()
      : translator.getLanguage?.() || "";

  useSyncExternalStore(
    (onStoreChange) => translator.subscribe(onStoreChange),
    getSnapshot,
    getSnapshot
  );
}

function toResult<
  T extends Record<string, any>,
  Fallback extends keyof T & string,
  S extends ScopeType<T, Fallback>
>(translator: LocL<T, Fallback, S, any, any>): UseLocLResult<T, Fallback, S> {
  return {
    translator,
    language: translator.getLanguage() as Language<T>,
    changeLanguage: (lang: Language<T>) => translator.changeLanguage(lang),
    getLanguage: () => translator.getLanguage() as Language<T>,
    ...bindApi<T, Fallback, S>(translator)
  };
}

function useScopedTranslation<
  T extends Record<string, any>,
  Fallback extends keyof T & string,
  S extends ScopeType<T, Fallback>
>(
  base: UseLocLResult<T, Fallback, any>,
  scope: S | undefined,
  options?: UseTranslationOptions
): UseTranslationResult<T, Fallback, S> {
  const { translator, language } = base;

  const scopeKey = Array.isArray(scope) ? scope.join("|") : scope;
  const scopeStr = typeof scope === "string" ? scope : undefined;

  const isReady = translator.isLoaded(language, scopeStr);
  if (!isReady && options?.suspense) {
    throw translator.load(language, scopeStr, options.loader);
  }

  useEffect(() => {
    if (!isReady && !options?.suspense) {
      translator.load(language, scopeStr, options?.loader).catch((err: any) => {
        console.error(`[LocL] Failed to load translations for "${scopeStr}":`, err);
      });
    }
  }, [translator, language, scopeStr, isReady, options?.loader, options?.suspense]);

  const scopedTranslator = useMemo(() => {
    return (scope !== undefined ? translator.withConfig({ scope } as any) : translator) as LocL<T, Fallback, S, any, any>;
  }, [translator, scopeKey]);

  return {
    ...toResult<T, Fallback, S>(scopedTranslator),
    ready: isReady
  };
}

/* =========================================================================
 * Standard Context Provider & Hooks
 * ========================================================================= */
export interface LocLProviderProps<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>,
  S extends ScopeType<T, Fallback> = undefined
> {
  translator: LocL<T, Fallback, S, any, any>;
  children: ReactNode;
}

export function LocLProvider<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>,
  S extends ScopeType<T, Fallback> = undefined
>({ translator, children }: LocLProviderProps<T, Fallback, S>) {
  return (
    <LocLContext.Provider value={translator}>
      {children}
    </LocLContext.Provider>
  );
}

export interface UseLocLResult<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>,
  S extends ScopeType<T, Fallback> = undefined
> extends TranslatorApi<T, Fallback, S> {
  translator: LocL<T, Fallback, S, any, any>;
  language: Language<T>;
  changeLanguage: (lang: Language<T>) => void;
  getLanguage: () => Language<T>;
}

export function useLocL<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>,
  S extends ScopeType<T, Fallback> = undefined
>(customTranslator?: LocL<T, Fallback, S, any, any> | LocL<any, any, any, any, any>): UseLocLResult<T, Fallback, S> {
  const contextTranslator = useContext(LocLContext);
  const translator = (customTranslator ?? contextTranslator) as LocL<T, Fallback, S, any, any> | null;

  if (!translator) {
    throw new Error("[LocL] `useLocL` must be used within a `<LocLProvider>`.");
  }

  useTranslatorSubscription(translator);
  return toResult<T, Fallback, S>(translator);
}

export interface UseTranslationOptions {
  /** Enables React <Suspense> integration, defaults to false */
  suspense?: boolean;
  /** Custom loader override */
  loader?: ResourceLoader;
}

export interface UseTranslationResult<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>,
  S extends ScopeType<T, Fallback> = undefined
> extends UseLocLResult<T, Fallback, S> {
  ready: boolean;
}

export function useTranslation<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>
>(
  scope?: undefined,
  options?: UseTranslationOptions,
  customTranslator?: LocL<T, Fallback, any, any, any> | LocL<any, any, any, any, any>
): UseTranslationResult<T, Fallback, undefined>;

export function useTranslation<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>,
  S extends ScopeType<T, Fallback> = ScopeType<T, Fallback>
>(
  scope: S,
  options?: UseTranslationOptions,
  customTranslator?: LocL<T, Fallback, any, any, any> | LocL<any, any, any, any, any>
): UseTranslationResult<T, Fallback, S>;

export function useTranslation<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>,
  S extends ScopeType<T, Fallback> = any
>(
  scope?: S,
  options?: UseTranslationOptions,
  customTranslator?: LocL<any, any, any, any, any>
): UseTranslationResult<T, Fallback, S> {
  const base = useLocL<T, Fallback, any>(customTranslator);
  return useScopedTranslation<T, Fallback, S>(base, scope, options);
}

/* =========================================================================
 * Zero-Declaration Hook Factory (`createLocLReact`)
 * ========================================================================= */
export interface BoundLocLProviderProps<
  T extends Record<string, any>,
  Fallback extends keyof T & string
> {
  translator?: LocL<any, any, any, any, any>;
  children: ReactNode;
}

export interface LocLReactSuite<
  T extends Record<string, any>,
  Fallback extends keyof T & string
> {
  LocLContext: React.Context<LocL<any, any, any, any, any> | null>;
  LocLProvider: (props: BoundLocLProviderProps<T, Fallback>) => ReactElement;
  useLocL: <S extends ScopeType<T, Fallback> = undefined>(
    customTranslator?: LocL<any, any, any, any, any>
  ) => UseLocLResult<T, Fallback, S>;
  useTranslation: {
    (): UseTranslationResult<T, Fallback, undefined>;
    (scope: undefined, options?: UseTranslationOptions): UseTranslationResult<T, Fallback, undefined>;
    <S extends Scope<T, Fallback>>(scope: S, options?: UseTranslationOptions): UseTranslationResult<T, Fallback, S>;
    <S extends Scope<T, Fallback>[]>(scope: S, options?: UseTranslationOptions): UseTranslationResult<T, Fallback, S>;
    (scope?: undefined, options?: UseTranslationOptions, customTranslator?: LocL<any, any, any, any, any>): UseTranslationResult<T, Fallback, undefined>;
    <S extends ScopeType<T, Fallback>>(scope: S, options?: UseTranslationOptions, customTranslator?: LocL<any, any, any, any, any>): UseTranslationResult<T, Fallback, S>;
  };
  Trans: <
    S extends ScopeType<T, Fallback> = undefined,
    K extends TransKey<T, Fallback, S> = TransKey<T, Fallback, S>
  >(
    props: TransProps<T, Fallback, S, K>
  ) => ReactElement;
  translator: LocL<T, Fallback, any, any, any>;
}

/**
 * Creates a pre-bound, zero-declaration React integration suite for a LocL translator instance.
 *
 * Infers resources, fallback language, translation keys, and namespace scopes
 * automatically without requiring `.d.ts` module declarations or manual generics.
 *
 * @example
 * ```ts
 * // i18n-react.ts
 * export const { LocLProvider, useTranslation, useLocL, Trans } = createLocLReact(translator);
 * ```
 */
export function createLocLReact<
  T extends Record<string, any>,
  Fallback extends keyof T & string
>(defaultTranslator: LocL<T, Fallback, any, any, any>): LocLReactSuite<T, Fallback> {
  const BoundContext = createContext<LocL<any, any, any, any, any> | null>(null);

  function BoundLocLProvider({
    translator = defaultTranslator,
    children
  }: BoundLocLProviderProps<T, Fallback>): ReactElement {
    return (
      <LocLContext.Provider value={translator}>
        <BoundContext.Provider value={translator}>
          {children}
        </BoundContext.Provider>
      </LocLContext.Provider>
    );
  }

  function useBoundLocL<S extends ScopeType<T, Fallback> = undefined>(
    customTranslator?: LocL<any, any, any, any, any>
  ): UseLocLResult<T, Fallback, S> {
    const contextTranslator = useContext(BoundContext);
    const translator = (customTranslator ?? contextTranslator ?? defaultTranslator) as LocL<T, Fallback, S, any, any>;

    useTranslatorSubscription(translator);
    return toResult<T, Fallback, S>(translator);
  }

  function useBoundTranslation(scope?: undefined, options?: UseTranslationOptions, customTranslator?: LocL<any, any, any, any, any>): UseTranslationResult<T, Fallback, undefined>;
  function useBoundTranslation<S extends ScopeType<T, Fallback>>(scope: S, options?: UseTranslationOptions, customTranslator?: LocL<any, any, any, any, any>): UseTranslationResult<T, Fallback, S>;
  function useBoundTranslation<S extends ScopeType<T, Fallback> = any>(
    scope?: S,
    options?: UseTranslationOptions,
    customTranslator?: LocL<any, any, any, any, any>
  ): UseTranslationResult<T, Fallback, S> {
    const base = useBoundLocL<any>(customTranslator);
    return useScopedTranslation<T, Fallback, S>(base, scope, options);
  }

  function BoundTrans<
    S extends ScopeType<T, Fallback> = undefined,
    K extends TransKey<T, Fallback, S> = TransKey<T, Fallback, S>
  >(props: TransProps<T, Fallback, S, K>): ReactElement {
    const contextTranslator = useContext(BoundContext);
    const activeTranslator = props.translator ?? contextTranslator ?? defaultTranslator;

    return (
      <Trans<T, Fallback, S, K>
        {...props}
        translator={activeTranslator}
      />
    );
  }

  return {
    LocLContext: BoundContext,
    LocLProvider: BoundLocLProvider,
    useLocL: useBoundLocL,
    useTranslation: useBoundTranslation as LocLReactSuite<T, Fallback>["useTranslation"],
    Trans: BoundTrans,
    translator: defaultTranslator
  };
}