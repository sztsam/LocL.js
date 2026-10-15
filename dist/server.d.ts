import { AsyncLocalStorage } from 'node:async_hooks';
import { a as LocL, S as ScopeType, T as TranslationObjectFor, I as InterpolationOptions, N as NestedKeyOf, P as PluralKeys, c as TArgs, d as TResult, e as Language, D as Direction, f as LocaleMetadata } from './LocL-Dlwcpdya.js';
export { H as HreflangLink, c as createI18nMiddleware, g as getHreflangLinks, h as handleI18nRouting, r as resolveRouteLocale } from './middleware-CgEwKV4U.js';

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
interface LocLServerRegister {
}
type DefaultServerResources = LocLServerRegister extends {
    translator: LocL<infer Res, any, any, any, any, any>;
} ? Res : LocLServerRegister extends {
    resources: infer Res extends Record<string, any>;
} ? Res : Record<string, any>;
type DefaultServerFallback<T = DefaultServerResources> = LocLServerRegister extends {
    translator: LocL<any, infer FB, any, any, any, any>;
} ? FB : LocLServerRegister extends {
    fallbackLanguage: infer FB extends string;
} ? FB : [keyof T & string] extends [never] ? string : keyof T & string;
interface ServerRequestContext<T extends Record<string, any> = Record<string, any>, Fallback extends keyof T & string = any> {
    locale?: string;
    translator?: LocL<any, any, any, any, any, any>;
    data?: Record<string, any>;
}
declare const serverStorage: AsyncLocalStorage<ServerRequestContext<Record<string, any>, any>>;
type ServerTranslator<T extends Record<string, any> = Record<string, any>, Fallback extends keyof T & string = any, S extends ScopeType<T, Fallback> = undefined, StrictParams extends boolean = true> = ([keyof TranslationObjectFor<S, T, Fallback>] extends [never] ? {
    (key: string, values?: InterpolationOptions, format?: any): any;
} : {}) & {
    <K extends (NestedKeyOf<TranslationObjectFor<S, T, Fallback>> | PluralKeys<S, T, Fallback>) & string>(key: K, ...args: TArgs<K, TranslationObjectFor<S, T, Fallback>, PluralKeys<S, T, Fallback>, any, any, StrictParams>): TResult<K, TranslationObjectFor<S, T, Fallback>, PluralKeys<S, T, Fallback>, StrictParams>;
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
interface LocLServerOptions<T extends Record<string, any> = DefaultServerResources, Fallback extends keyof T & string = DefaultServerFallback<T>> {
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
type GetTranslatorOptions<T extends Record<string, any> = DefaultServerResources, Fallback extends keyof T & string = DefaultServerFallback<T>, S = ScopeType<T, Fallback>> = {
    scope?: S;
    locale?: Language<T> | (string & {});
};
interface LocLServerSuite<T extends Record<string, any>, Fallback extends keyof T & string, StrictParams extends boolean = true> {
    getTranslator: {
        (): Promise<ServerTranslator<T, Fallback, undefined, StrictParams>>;
        (options: {
            locale?: Language<T> | (string & {});
        }): Promise<ServerTranslator<T, Fallback, undefined, StrictParams>>;
        <S extends ScopeType<T, Fallback>>(scope: S, options?: {
            locale?: Language<T> | (string & {});
        }): Promise<ServerTranslator<T, Fallback, S, StrictParams>>;
        <S extends ScopeType<T, Fallback>>(options: {
            scope: S;
            locale?: Language<T> | (string & {});
        }): Promise<ServerTranslator<T, Fallback, S, StrictParams>>;
        (scope: string | string[], options?: {
            locale?: Language<T> | (string & {});
        }): Promise<ServerTranslator<T, Fallback, any, StrictParams>>;
        (options: {
            scope?: string | string[];
            locale?: Language<T> | (string & {});
        }): Promise<ServerTranslator<T, Fallback, any, StrictParams>>;
    };
    getTranslations: LocLServerSuite<T, Fallback, StrictParams>["getTranslator"];
    getSyncTranslator: {
        (): ServerTranslator<T, Fallback, undefined, StrictParams>;
        (options: {
            locale?: Language<T> | (string & {});
        }): ServerTranslator<T, Fallback, undefined, StrictParams>;
        <S extends ScopeType<T, Fallback>>(scope: S, options?: {
            locale?: Language<T> | (string & {});
        }): ServerTranslator<T, Fallback, S, StrictParams>;
        <S extends ScopeType<T, Fallback>>(options: {
            scope: S;
            locale?: Language<T> | (string & {});
        }): ServerTranslator<T, Fallback, S, StrictParams>;
        (scope: string | string[], options?: {
            locale?: Language<T> | (string & {});
        }): ServerTranslator<T, Fallback, any, StrictParams>;
        (options: {
            scope?: string | string[];
            locale?: Language<T> | (string & {});
        }): ServerTranslator<T, Fallback, any, StrictParams>;
    };
    runWithLocale: <R>(locale: string, fn: () => R) => R;
    runWithTranslator: <R>(translator: LocL<any, any, any, any, any, any>, fn: () => R) => R;
    getLocale: () => string;
    setLocale: (locale: string) => void;
    storage: AsyncLocalStorage<ServerRequestContext>;
    translator: LocL<T, Fallback, any, any, any, StrictParams>;
}
declare function createServerTranslator<T extends Record<string, any>, Fallback extends keyof T & string, S extends ScopeType<T, Fallback> = undefined>(translator: LocL<T, Fallback, S, any, any, any>): ServerTranslator<T, Fallback, S>;
declare function createLocLServer<T extends Record<string, any> = DefaultServerResources, Fallback extends keyof T & string = DefaultServerFallback<T>, StrictParams extends boolean = true>(translatorOrOptions: LocL<T, Fallback, any, any, any, StrictParams> | LocLServerOptions<T, Fallback>, suiteOptions?: LocLServerOptions<T, Fallback>): LocLServerSuite<T, Fallback, StrictParams>;
declare function setServerTranslator<T extends Record<string, any>, Fallback extends keyof T & string>(translator: LocL<T, Fallback, any, any, any, any>, options?: LocLServerOptions<T, Fallback>): LocLServerSuite<T, Fallback>;
declare function getServerTranslator(): LocL<any, any, any, any, any, any> | null;
declare function runWithLocale<R>(locale: string, fn: () => R): R;
declare function runWithTranslator<R>(translator: LocL<any, any, any, any, any, any>, fn: () => R): R;
declare function getLocale(): string;
declare function setLocale(locale: string): void;
declare function getTranslator<T extends Record<string, any> = DefaultServerResources, Fallback extends keyof T & string = DefaultServerFallback<T>, S extends ScopeType<T, Fallback> = any>(scopeOrOptions?: S | string | string[] | GetTranslatorOptions<T, Fallback, any>, options?: {
    locale?: Language<T> | (string & {});
}): Promise<ServerTranslator<T, Fallback, any>>;
declare function getTranslations<T extends Record<string, any> = DefaultServerResources, Fallback extends keyof T & string = DefaultServerFallback<T>, S extends ScopeType<T, Fallback> = any>(scopeOrOptions?: S | string | string[] | GetTranslatorOptions<T, Fallback, any>, options?: {
    locale?: Language<T> | (string & {});
}): Promise<ServerTranslator<T, Fallback, any>>;
declare function getSyncTranslator<T extends Record<string, any> = DefaultServerResources, Fallback extends keyof T & string = DefaultServerFallback<T>, S extends ScopeType<T, Fallback> = any>(scopeOrOptions?: S | string | string[] | GetTranslatorOptions<T, Fallback, any>, options?: {
    locale?: Language<T> | (string & {});
}): ServerTranslator<T, Fallback, any>;

export { type DefaultServerFallback, type DefaultServerResources, type GetTranslatorOptions, type LocLServerOptions, type LocLServerRegister, type LocLServerSuite, type ServerRequestContext, type ServerTranslator, createLocLServer, createServerTranslator, getLocale, getServerTranslator, getSyncTranslator, getTranslations, getTranslator, runWithLocale, runWithTranslator, serverStorage, setLocale, setServerTranslator };
