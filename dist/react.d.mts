import React, { ReactElement, ReactNode } from 'react';
import { S as ScopeType, N as NestedKeyOf, T as TranslationObjectFor, P as PluralKeys, I as InterpolationOptions, a as LocL, c as Language } from './LocL-fN9Yari8.mjs';

type TransKey<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, S extends ScopeType<T, Fallback> = undefined> = (NestedKeyOf<TranslationObjectFor<S, T, Fallback>> | PluralKeys<S, T, Fallback>) & string;
interface TransProps<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, S extends ScopeType<T, Fallback> = undefined, K extends string = TransKey<T, Fallback, S>> {
    /** The translation key to look up (with IDE autocomplete + fallback tolerance) */
    i18nKey: K | (string & {});
    /** Values to interpolate into variable placeholders ({name}, {{name}}) */
    values?: InterpolationOptions;
    /**
     * Component elements or functions to substitute for `<tag>content</tag>`
     * @example
     * components={{
     *   bold: <strong />,
     *   link: (content) => <a href="/terms">{content}</a>
     * }}
     */
    components?: Record<string, ReactElement | ((content: ReactNode) => ReactNode)>;
    /** Optional custom translator instance if not using LocLContext */
    translator?: LocL<any, any, any, any, any>;
    /** Optional namespace scope for the translation key */
    scope?: S;
    /** Fallback string if key is not found */
    fallback?: string;
}
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
 *     link: <a href="/terms" />
 *   }}
 * />
 * ```
 */
declare function Trans<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, S extends ScopeType<T, Fallback> = undefined, K extends string = TransKey<T, Fallback, S>>({ i18nKey, values, components, translator: customTranslator, scope, fallback }: TransProps<T, Fallback, S, K>): ReactElement;

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
interface LocLRegister {
}
type DefaultResources = LocLRegister extends {
    translator: LocL<infer Res, any, any, any, any>;
} ? Res : LocLRegister extends {
    resources: infer Res extends Record<string, any>;
} ? Res : Record<string, any>;
type DefaultFallback<T = DefaultResources> = LocLRegister extends {
    translator: LocL<any, infer FB, any, any, any>;
} ? FB : LocLRegister extends {
    fallbackLanguage: infer FB extends string;
} ? FB : [keyof T & string] extends [never] ? string : keyof T & string;
declare const LocLContext: React.Context<LocL<any, any, any, any, any> | null>;
interface LocLProviderProps<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, S extends ScopeType<T, Fallback> = undefined> {
    translator: LocL<T, Fallback, S, any, any>;
    children: ReactNode;
}
declare function LocLProvider<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, S extends ScopeType<T, Fallback> = undefined>({ translator, children }: LocLProviderProps<T, Fallback, S>): React.JSX.Element;
interface UseLocLResult<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, S extends ScopeType<T, Fallback> = undefined> {
    translator: LocL<T, Fallback, S, any, any>;
    language: Language<T>;
    changeLanguage: (lang: Language<T>) => void;
    t: LocL<T, Fallback, S>["t"];
    plural: LocL<T, Fallback, S>["plural"];
    rich: LocL<T, Fallback, S>["rich"];
    format: LocL<T, Fallback, S>["format"];
}
interface UseTranslationResult<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, S extends ScopeType<T, Fallback> = undefined> extends UseLocLResult<T, Fallback, S> {
}
declare function useLocL<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, S extends ScopeType<T, Fallback> = undefined>(customTranslator?: LocL<any, any, any, any, any>): UseLocLResult<T, Fallback, S>;
declare function useTranslation<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>>(scope?: undefined, customTranslator?: LocL<any, any, any, any, any>): UseTranslationResult<T, Fallback, undefined>;
declare function useTranslation<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, S extends ScopeType<T, Fallback> = ScopeType<T, Fallback>>(scope: S, customTranslator?: LocL<any, any, any, any, any>): UseTranslationResult<T, Fallback, S>;
interface BoundLocLProviderProps<T extends Record<string, any>, Fallback extends keyof T & string> {
    /** Optional override translator; defaults to the instance passed to `createLocLReact` */
    translator?: LocL<any, any, any, any, any>;
    children: ReactNode;
}
interface LocLReactSuite<T extends Record<string, any>, Fallback extends keyof T & string> {
    LocLContext: React.Context<LocL<any, any, any, any, any> | null>;
    LocLProvider: (props: BoundLocLProviderProps<T, Fallback>) => ReactElement;
    useLocL: <S extends ScopeType<T, Fallback> = undefined>(customTranslator?: LocL<any, any, any, any, any>) => UseLocLResult<T, Fallback, S>;
    useTranslation: {
        (scope?: undefined, customTranslator?: LocL<any, any, any, any, any>): UseTranslationResult<T, Fallback, undefined>;
        <S extends ScopeType<T, Fallback>>(scope: S, customTranslator?: LocL<any, any, any, any, any>): UseTranslationResult<T, Fallback, S>;
        <S extends ScopeType<T, Fallback> = any>(scope?: S, customTranslator?: LocL<any, any, any, any, any>): UseTranslationResult<T, Fallback, S>;
    };
    Trans: <S extends ScopeType<T, Fallback> = undefined, K extends string = TransKey<T, Fallback, S>>(props: TransProps<T, Fallback, S, K>) => ReactElement;
    translator: LocL<T, Fallback, any, any, any>;
}
/**
 * Creates a pre-bound, zero-declaration React integration suite for a LocL translator instance.
 *
 * Inifers resources, fallback language, translation keys, and namespace scopes
 * automatically without requiring `.d.ts` module declarations or manual generics.
 *
 * @example
 * ```ts
 * // i18n-react.ts
 * export const { LocLProvider, useTranslation, useLocL, Trans } = createLocLReact(translator);
 * ```
 */
declare function createLocLReact<T extends Record<string, any>, Fallback extends keyof T & string>(defaultTranslator: LocL<T, Fallback, any, any, any>): LocLReactSuite<T, Fallback>;

export { type BoundLocLProviderProps, type DefaultFallback, type DefaultResources, LocLContext, LocLProvider, type LocLProviderProps, type LocLReactSuite, type LocLRegister, Trans, type TransKey, type TransProps, type UseLocLResult, type UseTranslationResult, createLocLReact, useLocL, useTranslation };
