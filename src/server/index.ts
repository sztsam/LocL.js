import { AsyncLocalStorage } from "node:async_hooks";
import { LocL } from "../LocL.js";
import { ScopeType, Language, Direction, LocaleMetadata, NestedKeyOf, PluralKeys, TranslationObjectFor, TArgs, TResult, InterpolationOptions } from "../types.js";
import { resolveRouteLocale, createI18nMiddleware, handleI18nRouting, getHreflangLinks, type HreflangLink } from "../detector/middleware.js";

export { resolveRouteLocale, createI18nMiddleware, handleI18nRouting, getHreflangLinks, type HreflangLink };

/* =========================================================================
 * Global Server Registry & Request Storage
 * ========================================================================= */

/**
 * Global type registry for LocL Server.
 * Augment this interface in user application code for zero-boilerplate,
 * 100% type-safe autocompletion across React Server Components and server routes:
 *
 * @example
 * ```ts
 * declare module "locl-js/server" {
 *   interface LocLServerRegister {
 *     translator: typeof translator;
 *   }
 * }
 * ```
 */
export interface LocLServerRegister {}

export type DefaultServerResources = LocLServerRegister extends {
  translator: LocL<infer Res, any, any, any, any, any>;
}
  ? Res
  : LocLServerRegister extends { resources: infer Res extends Record<string, any> }
    ? Res
    : Record<string, any>;

export type DefaultServerFallback<T = DefaultServerResources> = LocLServerRegister extends {
  translator: LocL<any, infer FB, any, any, any, any>;
}
  ? FB
  : LocLServerRegister extends { fallbackLanguage: infer FB extends string }
    ? FB
    : [keyof T & string] extends [never]
      ? string
      : keyof T & string;

export interface ServerRequestContext<
  T extends Record<string, any> = Record<string, any>,
  Fallback extends keyof T & string = any
> {
  locale?: string;
  translator?: LocL<any, any, any, any, any, any>;
  data?: Record<string, any>;
}

export const serverStorage = new AsyncLocalStorage<ServerRequestContext>();

/* =========================================================================
 * Server Translator & Option Types
 * ========================================================================= */

export type ServerTranslator<
  T extends Record<string, any> = Record<string, any>,
  Fallback extends keyof T & string = any,
  S extends ScopeType<T, Fallback> = undefined,
  StrictParams extends boolean = true
> = ([keyof TranslationObjectFor<S, T, Fallback>] extends [never]
  ? { (key: string, values?: InterpolationOptions, format?: any): any }
  : {}) & {
  <K extends (NestedKeyOf<TranslationObjectFor<S, T, Fallback>> | PluralKeys<S, T, Fallback>) & string>(
    key: K,
    ...args: TArgs<K, TranslationObjectFor<S, T, Fallback>, PluralKeys<S, T, Fallback>, any, any, StrictParams>
  ): TResult<K, TranslationObjectFor<S, T, Fallback>, PluralKeys<S, T, Fallback>, StrictParams>;
  (): TranslationObjectFor<S, T, Fallback>;

  t: LocL<T, Fallback, S, any, any, StrictParams>["t"];
  tt: LocL<T, Fallback, S, any, any, StrictParams>["tt"];
  plural: LocL<T, Fallback, S, any, any, StrictParams>["plural"];
  ordinal: LocL<T, Fallback, S, any, any, StrictParams>["ordinal"];
  rich: LocL<T, Fallback, S, any, any, StrictParams>["rich"];
  format: LocL<T, Fallback, S, any, any, StrictParams>["format"];
  get: LocL<T, Fallback, S, any, any, StrictParams>["get"];
  getObj: LocL<T, Fallback, S, any, any, StrictParams>["getObj"];
  getLanguage: () => Language<T>;
  language: Language<T>;
  direction: Direction;
  getDirection: (lang?: string) => Direction;
  isRTL: (lang?: string) => boolean;
  getMetadata: (lang?: string) => LocaleMetadata;
  translator: LocL<T, Fallback, S, any, any, StrictParams>;
};

export interface LocLServerOptions<
  T extends Record<string, any> = DefaultServerResources,
  Fallback extends keyof T & string = DefaultServerFallback<T>
> {
  /** The base translator instance */
  translator?: LocL<T, any, any, any, any, any>;
  /** Translation resources if creating instance inline */
  resources?: T;
  /** Fallback language */
  fallbackLanguage?: Fallback;
  /** Custom function to resolve the active locale for the request */
  getLocale?: () => string | Promise<string>;
  /** Whether to automatically load missing namespaces via translator.load(). Defaults to true. */
  autoLoad?: boolean;
  /** Optional custom AsyncLocalStorage instance */
  storage?: AsyncLocalStorage<ServerRequestContext<T, Fallback>> | AsyncLocalStorage<ServerRequestContext>;
}

export type GetTranslatorOptions<
  T extends Record<string, any> = DefaultServerResources,
  Fallback extends keyof T & string = DefaultServerFallback<T>,
  S = ScopeType<T, Fallback>
> = {
  scope?: S;
  locale?: Language<T> | (string & {});
};

export interface LocLServerSuite<
  T extends Record<string, any>,
  Fallback extends keyof T & string,
  StrictParams extends boolean = true
> {
  getTranslator: {
    (): Promise<ServerTranslator<T, Fallback, undefined, StrictParams>>;
    (options: { locale?: Language<T> | (string & {}) }): Promise<ServerTranslator<T, Fallback, undefined, StrictParams>>;
    <S extends ScopeType<T, Fallback>>(scope: S, options?: { locale?: Language<T> | (string & {}) }): Promise<ServerTranslator<T, Fallback, S, StrictParams>>;
    <S extends ScopeType<T, Fallback>>(options: { scope: S; locale?: Language<T> | (string & {}) }): Promise<ServerTranslator<T, Fallback, S, StrictParams>>;
    (scope: string | string[], options?: { locale?: Language<T> | (string & {}) }): Promise<ServerTranslator<T, Fallback, any, StrictParams>>;
    (options: { scope?: string | string[]; locale?: Language<T> | (string & {}) }): Promise<ServerTranslator<T, Fallback, any, StrictParams>>;
  };
  getTranslations: LocLServerSuite<T, Fallback, StrictParams>["getTranslator"];
  getSyncTranslator: {
    (): ServerTranslator<T, Fallback, undefined, StrictParams>;
    (options: { locale?: Language<T> | (string & {}) }): ServerTranslator<T, Fallback, undefined, StrictParams>;
    <S extends ScopeType<T, Fallback>>(scope: S, options?: { locale?: Language<T> | (string & {}) }): ServerTranslator<T, Fallback, S, StrictParams>;
    <S extends ScopeType<T, Fallback>>(options: { scope: S; locale?: Language<T> | (string & {}) }): ServerTranslator<T, Fallback, S, StrictParams>;
    (scope: string | string[], options?: { locale?: Language<T> | (string & {}) }): ServerTranslator<T, Fallback, any, StrictParams>;
    (options: { scope?: string | string[]; locale?: Language<T> | (string & {}) }): ServerTranslator<T, Fallback, any, StrictParams>;
  };
  runWithLocale: <R>(locale: string, fn: () => R) => R;
  runWithTranslator: <R>(translator: LocL<any, any, any, any, any, any>, fn: () => R) => R;
  getLocale: () => string;
  setLocale: (locale: string) => void;
  storage: AsyncLocalStorage<ServerRequestContext>;
  translator: LocL<T, Fallback, any, any, any, StrictParams>;
}

/* =========================================================================
 * Helper: Create ServerTranslator wrapper
 * ========================================================================= */

export function createServerTranslator<
  T extends Record<string, any>,
  Fallback extends keyof T & string,
  S extends ScopeType<T, Fallback> = undefined
>(translator: LocL<T, Fallback, S, any, any, any>): ServerTranslator<T, Fallback, S> {
  const tFn = function (key?: string, values?: any, format?: any) {
    return (translator as any).t(key, values, format);
  };

  tFn.t = translator.t.bind(translator);
  tFn.tt = translator.tt.bind(translator);
  tFn.plural = translator.plural.bind(translator);
  tFn.ordinal = translator.ordinal.bind(translator);
  tFn.rich = translator.rich.bind(translator);
  tFn.format = translator.format.bind(translator);
  tFn.get = translator.get.bind(translator);
  tFn.getObj = translator.getObj.bind(translator);
  tFn.getLanguage = translator.getLanguage.bind(translator);
  tFn.getDirection = translator.getDirection.bind(translator);
  tFn.isRTL = translator.isRTL.bind(translator);
  tFn.getMetadata = translator.getMetadata.bind(translator);
  tFn.translator = translator;

  Object.defineProperty(tFn, "language", {
    get: () => translator.getLanguage(),
    enumerable: true
  });
  Object.defineProperty(tFn, "direction", {
    get: () => translator.getDirection(),
    enumerable: true
  });

  return tFn as unknown as ServerTranslator<T, Fallback, S>;
}

function parseGetTranslatorArgs(arg1?: unknown, arg2?: { locale?: string }): { scope?: any; locale?: string } {
  if (typeof arg1 === "string" || Array.isArray(arg1)) {
    return { scope: arg1, locale: arg2?.locale };
  }
  if (arg1 && typeof arg1 === "object") {
    const opts = arg1 as { scope?: any; locale?: string };
    return { scope: opts.scope, locale: opts.locale };
  }
  return { scope: undefined, locale: undefined };
}

/* =========================================================================
 * Factory: createLocLServer
 * ========================================================================= */
export function createLocLServer<
  T extends Record<string, any> = DefaultServerResources,
  Fallback extends keyof T & string = DefaultServerFallback<T>,
  StrictParams extends boolean = true
>(
  translatorOrOptions: LocL<T, Fallback, any, any, any, StrictParams> | LocLServerOptions<T, Fallback>,
  suiteOptions?: LocLServerOptions<T, Fallback>
): LocLServerSuite<T, Fallback, StrictParams> {
  let baseTranslator: LocL<T, Fallback, any, any, any, any>;
  let opts: LocLServerOptions<T, Fallback>;

  const isLocLInstance = translatorOrOptions instanceof LocL || typeof (translatorOrOptions as any)?.t === "function";

  if (isLocLInstance) {
    baseTranslator = translatorOrOptions as LocL<T, Fallback, any, any, any, any>;
    opts = suiteOptions ?? {};
  } else if (translatorOrOptions && typeof translatorOrOptions === "object") {
    opts = translatorOrOptions;
    if (opts.translator) {
      baseTranslator = opts.translator;
    } else if (opts.resources && opts.fallbackLanguage) {
      baseTranslator = new LocL({
        ...opts,
        resources: opts.resources,
        fallbackLanguage: opts.fallbackLanguage
      } as any);
    } else {
      throw new Error("[LocL/server] `createLocLServer` requires a LocL instance or resources configuration.");
    }
  } else {
    throw new Error("[LocL/server] `createLocLServer` requires a LocL instance or resources configuration.");
  }

  const storage = (opts.storage ?? serverStorage) as AsyncLocalStorage<ServerRequestContext>;

  function runWithLocale<R>(locale: string, fn: () => R): R {
    const current = storage.getStore() as ServerRequestContext<T, Fallback> | undefined;
    const next: ServerRequestContext<T, Fallback> = {
      ...(current && typeof current === "object" ? current : {}),
      locale
    };
    return storage.run(next, fn);
  }

  function runWithTranslator<R>(trans: LocL<any, any, any, any, any, any>, fn: () => R): R {
    const current = storage.getStore() as ServerRequestContext<T, Fallback> | undefined;
    const next: ServerRequestContext<T, Fallback> = {
      ...(current && typeof current === "object" ? current : {}),
      translator: trans,
      locale: trans.getLanguage()
    };
    return storage.run(next, fn);
  }

  function getLocale(): string {
    const store = storage.getStore() as ServerRequestContext<T, Fallback> | undefined;
    return store?.locale ?? baseTranslator.getLanguage();
  }

  function setLocale(locale: string): void {
    const store = storage.getStore() as ServerRequestContext<T, Fallback> | undefined;
    if (store) {
      store.locale = locale;
    }
  }

  async function resolveTranslatorInstance(arg1?: any, arg2?: any): Promise<{ translator: LocL<any, any, any, any, any, any>; locale: string }> {
    const { scope, locale: explicitLocale } = parseGetTranslatorArgs(arg1, arg2);
    const store = storage.getStore() as ServerRequestContext<T, Fallback> | undefined;

    let targetLocale = explicitLocale ?? store?.locale;
    if (!targetLocale && opts.getLocale) {
      targetLocale = await opts.getLocale();
    }
    const activeBase = store?.translator ?? baseTranslator;
    if (!targetLocale) {
      targetLocale = activeBase.getLanguage();
    }

    let instance: LocL<any, any, any, any, any, any> = activeBase;
    if (targetLocale !== activeBase.getLanguage() || scope !== undefined) {
      instance = activeBase.withConfig({
        language: targetLocale,
        scope: scope
      });
    }

    if (opts.autoLoad !== false && typeof instance.load === "function") {
      const scopes: (string | undefined)[] = Array.isArray(scope)
        ? scope
        : (typeof scope === "string" ? [scope] : [undefined]);

      const loadTasks: Promise<void>[] = [];
      for (const s of scopes) {
        if (!instance.isLoaded(targetLocale, s)) {
          loadTasks.push(instance.load(targetLocale, s));
        }
      }
      if (loadTasks.length > 0) {
        await Promise.all(loadTasks);
      }
    }

    return { translator: instance, locale: targetLocale };
  }

  async function getTranslator(arg1?: any, arg2?: any) {
    const { translator } = await resolveTranslatorInstance(arg1, arg2);
    return createServerTranslator(translator);
  }

  function getSyncTranslator(arg1?: any, arg2?: any) {
    const { scope, locale: explicitLocale } = parseGetTranslatorArgs(arg1, arg2);
    const store = storage.getStore() as ServerRequestContext<T, Fallback> | undefined;
    const targetLocale = explicitLocale ?? store?.locale ?? (store?.translator ?? baseTranslator).getLanguage();
    const activeBase = store?.translator ?? baseTranslator;

    let instance: LocL<any, any, any, any, any, any> = activeBase;
    if (targetLocale !== activeBase.getLanguage() || scope !== undefined) {
      instance = activeBase.withConfig({
        language: targetLocale,
        scope: scope
      });
    }

    return createServerTranslator(instance);
  }

  const suite: LocLServerSuite<T, Fallback, StrictParams> = {
    getTranslator: getTranslator as LocLServerSuite<T, Fallback, StrictParams>["getTranslator"],
    getTranslations: getTranslator as LocLServerSuite<T, Fallback, StrictParams>["getTranslations"],
    getSyncTranslator: getSyncTranslator as LocLServerSuite<T, Fallback, StrictParams>["getSyncTranslator"],
    runWithLocale,
    runWithTranslator,
    getLocale,
    setLocale,
    storage,
    translator: baseTranslator
  };

  if (!defaultServerInstance) {
    defaultServerInstance = suite;
  }

  return suite;
}

/* =========================================================================
 * Standalone Singleton Helpers
 * ========================================================================= */

let defaultServerInstance: LocLServerSuite<any, any> | null = null;

export function setServerTranslator<T extends Record<string, any>, Fallback extends keyof T & string>(translator: LocL<T, Fallback, any, any, any, any>, options?: LocLServerOptions<T, Fallback>): LocLServerSuite<T, Fallback> {
  const suite = createLocLServer(translator, options);
  defaultServerInstance = suite;
  return suite;
}

export function getServerTranslator(): LocL<any, any, any, any, any, any> | null {
  return defaultServerInstance ? defaultServerInstance.translator : null;
}

function getDefaultSuite(): LocLServerSuite<any, any> {
  if (!defaultServerInstance) {
    throw new Error(
      "[LocL/server] No server translator configured. Call `setServerTranslator(translator)` or use `createLocLServer(translator)`."
    );
  }
  return defaultServerInstance;
}

export function runWithLocale<R>(locale: string, fn: () => R): R {
  if (defaultServerInstance) {
    return defaultServerInstance.runWithLocale(locale, fn);
  }
  const current = serverStorage.getStore();
  return serverStorage.run({ ...(current && typeof current === "object" ? current : {}), locale }, fn);
}

export function runWithTranslator<R>(translator: LocL<any, any, any, any, any, any>, fn: () => R): R {
  if (defaultServerInstance) {
    return defaultServerInstance.runWithTranslator(translator, fn);
  }
  const current = serverStorage.getStore();
  return serverStorage.run({ ...(current && typeof current === "object" ? current : {}), translator, locale: translator.getLanguage() }, fn);
}

export function getLocale(): string {
  const store = serverStorage.getStore();
  if (store?.locale) { return store.locale; }
  if (defaultServerInstance) { return defaultServerInstance.getLocale(); }
  return "en";
}

export function setLocale(locale: string): void {
  const store = serverStorage.getStore();
  if (store) {
    store.locale = locale;
  }
}

export async function getTranslator<
  T extends Record<string, any> = DefaultServerResources,
  Fallback extends keyof T & string = DefaultServerFallback<T>,
  S extends ScopeType<T, Fallback> = any
>(
  scopeOrOptions?: S | string | string[] | GetTranslatorOptions<T, Fallback, any>,
  options?: { locale?: Language<T> | (string & {}) }
): Promise<ServerTranslator<T, Fallback, any>> {
  return getDefaultSuite().getTranslator(scopeOrOptions as any, options);
}

export async function getTranslations<
  T extends Record<string, any> = DefaultServerResources,
  Fallback extends keyof T & string = DefaultServerFallback<T>,
  S extends ScopeType<T, Fallback> = any
>(
  scopeOrOptions?: S | string | string[] | GetTranslatorOptions<T, Fallback, any>,
  options?: { locale?: Language<T> | (string & {}) }
): Promise<ServerTranslator<T, Fallback, any>> {
  return getTranslator(scopeOrOptions as any, options);
}

export function getSyncTranslator<
  T extends Record<string, any> = DefaultServerResources,
  Fallback extends keyof T & string = DefaultServerFallback<T>,
  S extends ScopeType<T, Fallback> = any
>(
  scopeOrOptions?: S | string | string[] | GetTranslatorOptions<T, Fallback, any>,
  options?: { locale?: Language<T> | (string & {}) }
): ServerTranslator<T, Fallback, any> {
  return getDefaultSuite().getSyncTranslator(scopeOrOptions as any, options);
}