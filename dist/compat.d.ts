import { a as LocL, T as TranslationObjectFor, P as PluralKeys, N as NestedKeyOf, I as IsEmptyParams, c as ParamsFor, d as PathValue, e as PluralParamsFor, f as InterpolationOptions } from './LocL-CywjdTt7.js';
import { DefaultResources, DefaultFallback } from './react.js';
import 'react';

type NormalizeKey<K extends string> = K extends `${infer NS}:${infer Rest}` ? `${NS}.${Rest}` : K;
type ColonKeys<K extends string> = K extends `${infer NS}.${infer Rest}` ? `${NS}:${Rest}` | `${NS}.${Rest}` : K;
type BaseKeys<Tr, PK extends string> = ((Tr extends object ? NestedKeyOf<Tr> : never) | PK) & string;
type I18nextKey<Tr, PK extends string> = ColonKeys<BaseKeys<Tr, PK>>;
interface I18nextOptions extends InterpolationOptions {
    ns?: string;
    defaultValue?: string;
    count?: number;
}
type I18nextParamsFor<K extends string, Tr, PK extends string> = NormalizeKey<K> extends PK ? PluralParamsFor<NormalizeKey<K>, Tr> : ParamsFor<PathValue<Tr, NormalizeKey<K>>>;
type I18nextHasParams<K extends string, Tr, PK extends string> = NormalizeKey<K> extends PK ? true : IsEmptyParams<ParamsFor<PathValue<Tr, NormalizeKey<K>>>> extends true ? false : true;
type I18nextOptionsFor<K extends string, Tr, PK extends string> = I18nextParamsFor<K, Tr, PK> & I18nextOptions;
interface I18nextTranslation<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, Tr = TranslationObjectFor<undefined, T, Fallback>, PK extends string = PluralKeys<undefined, T, Fallback>> {
    <K extends I18nextKey<Tr, PK>>(key: K, ...args: I18nextHasParams<K, Tr, PK> extends true ? [options: I18nextOptionsFor<K, Tr, PK>] : [options?: I18nextOptions]): string;
    <K extends I18nextKey<Tr, PK>>(key: K, defaultValue: string, ...args: I18nextHasParams<K, Tr, PK> extends true ? [options: I18nextOptionsFor<K, Tr, PK>] : [options?: I18nextOptions]): string;
    (key: string, defaultValue: string, options?: I18nextOptions): string;
    (key: string, options: {
        defaultValue: string;
    } & I18nextOptions): string;
    (key: string, options: {
        ns: string;
    } & I18nextOptions): string;
}
interface I18nextCompat<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, Tr = TranslationObjectFor<undefined, T, Fallback>, PK extends string = PluralKeys<undefined, T, Fallback>> {
    t: I18nextTranslation<T, Fallback>;
    exists<K extends I18nextKey<Tr, PK>>(key: K, options?: {
        ns?: string;
        [key: string]: any;
    }): boolean;
    exists(key: string, options?: {
        ns?: string;
        [key: string]: any;
    }): boolean;
    get language(): string;
    get languages(): string[];
    changeLanguage(lng: string, callback?: (err: any, t: any) => void): Promise<string>;
    on(event: string, listener: (...args: any[]) => void): () => void;
    off(event: string, listener: (...args: any[]) => void): void;
    addResource(lng: string, ns: string, key: string, value: any): void;
    addResources(lng: string, ns: string, resources: any): void;
    addResourceBundle(lng: string, ns: string, resources: any, deep?: boolean, overwrite?: boolean): void;
    hasResourceBundle(lng: string, ns: string): boolean;
    getResourceBundle(lng: string, ns: string): any;
    loadNamespaces(ns: string | string[], callback?: (err?: any) => void): Promise<void>;
    translator: LocL<T, Fallback, any, any, any>;
}
declare function toI18next<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>>(translator: LocL<T, Fallback, any, any, any>): I18nextCompat<T, Fallback>;
declare const createI18nextCompat: typeof toI18next;

export { createI18nextCompat, toI18next };
