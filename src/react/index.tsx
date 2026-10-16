import React, { createContext, useContext, useSyncExternalStore, ReactNode, ReactElement, useMemo, useEffect } from "react";
import { LocL } from "../LocL.js";
import { ScopeType, Language, Scope, ResourceLoader, Direction } from "../types.js";
import { Trans, type TransProps, type TransKey, type TransValues } from "./Trans.js";
import { getLocalizedPath, type PrefixStrategy } from "../detector/middleware.js";

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
 * Shared Internals & Suspense Cache
 * ========================================================================= */

export type TranslatorApi<
  T extends Record<string, any>,
  Fallback extends keyof T & string,
  S extends ScopeType<T, Fallback>
> = Pick<LocL<T, Fallback, S>, "t" | "tt" | "plural" | "ordinal" | "rich" | "format" | "get" | "getObj" | "getDirection" | "isRTL" | "getMetadata">;

function bindApi<
  T extends Record<string, any>,
  Fallback extends keyof T & string,
  S extends ScopeType<T, Fallback>
>(translator: LocL<T, Fallback, S, any, any>): TranslatorApi<T, Fallback, S> {
  return {
    t: translator.t.bind(translator) as LocL<T, Fallback, S>["t"],
    tt: translator.tt.bind(translator) as LocL<T, Fallback, S>["tt"],
    plural: translator.plural.bind(translator) as LocL<T, Fallback, S>["plural"],
    ordinal: translator.ordinal.bind(translator) as LocL<T, Fallback, S>["ordinal"],
    rich: translator.rich.bind(translator) as LocL<T, Fallback, S>["rich"],
    format: translator.format.bind(translator) as LocL<T, Fallback, S>["format"],
    get: translator.get.bind(translator) as LocL<T, Fallback, S>["get"],
    getObj: translator.getObj.bind(translator) as LocL<T, Fallback, S>["getObj"],
    getDirection: translator.getDirection.bind(translator) as LocL<T, Fallback, S>["getDirection"],
    isRTL: translator.isRTL.bind(translator) as LocL<T, Fallback, S>["isRTL"],
    getMetadata: translator.getMetadata.bind(translator) as LocL<T, Fallback, S>["getMetadata"]
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
    direction: translator.getDirection(),
    ...bindApi<T, Fallback, S>(translator)
  };
}

const SUSPENSE_FAILURE_TTL_MS = 2000;
type SuspenseLoadState =
  | { status: "pending"; promise: Promise<void> }
  | { status: "failed"; error: unknown; failedAt: number };
const suspenseLoads = new WeakMap<object, Map<string, SuspenseLoadState>>();

function suspendUntilLoaded(
  translator: LocL<any, any, any, any, any>,
  language: string,
  scopes: (string | undefined)[],
  loader: ResourceLoader | undefined
): never {
  const root: object = (translator as any).rootInstance ?? translator;
  let loads = suspenseLoads.get(root);
  if (!loads) {
    loads = new Map();
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

  const promises: Promise<void>[] = [];
  for (const s of scopes) {
    if (translator.isLoaded(language, s)) { continue; }

    const key = `${language}::${s ?? "*"}`;
    const state = loads.get(key);
    if (state && state.status === "pending") {
      promises.push(state.promise);
      continue;
    }

    const loadPromise = translator.load(language, s, loader).then(
      () => {
        if (loads!.get(key)?.status === "pending") {
          loads!.delete(key);
        }
      },
      (error: unknown) => {
        loads!.set(key, {
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
  const scopes: (string | undefined)[] = Array.isArray(scope)
    ? scope
    : (typeof scope === "string" ? [scope] : [undefined]);

  const isReady = scopes.every((s) => translator.isLoaded(language, s));

  if (!isReady && options?.suspense) {
    suspendUntilLoaded(translator, language, scopes, options.loader);
  }

  useEffect(() => {
    if (!isReady && !options?.suspense) {
      const pendingScopes = scopes.filter((s) => !translator.isLoaded(language, s));
      if (pendingScopes.length > 0) {
        Promise.all(pendingScopes.map((s) => translator.load(language, s, options?.loader))).catch((err: any) => {
          console.error(`[LocL] Failed to load translations for "${scopeKey}":`, err);
        });
      }
    }
  }, [translator, language, scopeKey, isReady, options?.loader, options?.suspense]);

  const scopedTranslator = useMemo(() => {
    return (scope !== undefined ? translator.withConfig({ scope }) : translator) as LocL<T, Fallback, S, any, any>;
  }, [translator, scopeKey]);

  return {
    ...toResult<T, Fallback, S>(scopedTranslator),
    ready: isReady
  };
}

export interface LocLHydrateProps {
  state: {
    locale: string;
    resources: Record<string, any>;
    direction?: Direction;
  };
  children?: ReactNode;
  translator?: LocL<any, any, any, any, any>;
}

export function LocLHydrate({ state, children, translator: customTranslator }: LocLHydrateProps): ReactElement {
  const contextTranslator = useContext(LocLContext);
  const translator = customTranslator ?? contextTranslator;

  if (translator && state) {
    if (state.resources && state.locale && state.resources[state.locale]) {
      translator.addResources(state.locale, state.resources[state.locale]);
    }
    if (state.locale && translator.getLanguage() !== state.locale) {
      translator.changeLanguage(state.locale);
    }
  }

  return (
    <>
      <script
        id="__LOCL_DATA__"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(state) }}
      />
      {children}
    </>
  );
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  locale?: string;
  prefixStrategy?: PrefixStrategy;
  children?: ReactNode;
}

export function Link({ href, locale, prefixStrategy = "as-needed", ...rest }: LinkProps): ReactElement {
  const translator = useContext(LocLContext);
  const activeLocale = locale ?? (translator?.getLanguage() || "en");
  const fallbackLocale = (translator as any)?.fallbackLanguage || "en";
  const localizedHref = getLocalizedPath(href, activeLocale, fallbackLocale, prefixStrategy);

  return <a href={localizedHref} {...rest} />;
}

export function useLocalizedPath(prefixStrategy: PrefixStrategy = "as-needed") {
  const translator = useContext(LocLContext);
  const activeLocale = translator?.getLanguage() || "en";
  const fallbackLocale = (translator as any)?.fallbackLanguage || "en";
  return (pathname: string, localeOverride?: string) =>
    getLocalizedPath(pathname, localeOverride ?? activeLocale, fallbackLocale, prefixStrategy);
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
  direction: Direction;
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
  Hydrate: (props: LocLHydrateProps) => ReactElement;
  Link: (props: LinkProps) => ReactElement;
  useLocalizedPath: (prefixStrategy?: PrefixStrategy) => (pathname: string, localeOverride?: string) => string;
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

  function useBoundLocalizedPath(prefixStrategy: PrefixStrategy = "as-needed") {
    const contextTranslator = useContext(BoundContext);
    const translator = contextTranslator ?? defaultTranslator;
    const activeLocale = translator.getLanguage();
    const fallbackLocale = (translator as any).fallbackLanguage;
    return (pathname: string, localeOverride?: string) =>
      getLocalizedPath(pathname, localeOverride ?? activeLocale, fallbackLocale, prefixStrategy);
  }

  function BoundLink({ href, locale, prefixStrategy = "as-needed", ...rest }: LinkProps): ReactElement {
    const getPath = useBoundLocalizedPath(prefixStrategy);
    return <a href={getPath(href, locale)} {...rest} />;
  }

  function BoundHydrate(props: LocLHydrateProps): ReactElement {
    const contextTranslator = useContext(BoundContext);
    const activeTranslator = props.translator ?? contextTranslator ?? defaultTranslator;

    return <LocLHydrate {...props} translator={activeTranslator} />;
  }

  return {
    LocLContext: BoundContext,
    LocLProvider: BoundLocLProvider,
    useLocL: useBoundLocL,
    useTranslation: useBoundTranslation as LocLReactSuite<T, Fallback>["useTranslation"],
    Trans: BoundTrans,
    Hydrate: BoundHydrate,
    Link: BoundLink,
    useLocalizedPath: useBoundLocalizedPath,
    translator: defaultTranslator
  };
}