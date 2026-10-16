import { L as LocL, T as TranslationObjectFor, P as PluralKeys, N as NestedKeyOf, e as IsEmptyParams, I as InterpolationOptions, f as PluralParamsFor, g as ParamsFor, h as PathValue, D as Direction } from './LocL-Dnobyznm.cjs';
import { DefaultResources, DefaultFallback } from './react.cjs';
import 'react';
import './middleware-DHb1prPZ.cjs';

type NormalizeKey<K extends string> = K extends `${infer NS}:${infer Rest}` ? `${NS}.${Rest}` : K;
type ColonKeys<K extends string> = K extends `${infer NS}.${infer Rest}` ? `${NS}:${Rest}` | `${NS}.${Rest}` : K;
type BaseKeys<Tr, PK extends string> = ((Tr extends object ? NestedKeyOf<Tr> : never) | PK) & string;
type I18nextKey<Tr, PK extends string> = ColonKeys<BaseKeys<Tr, PK>>;
interface I18nextOptions extends InterpolationOptions {
    ns?: string;
    defaultValue?: string;
    count?: number;
}
type I18nextParamsFor<K extends string, Tr, PK extends string> = unknown extends K ? InterpolationOptions : NormalizeKey<K> extends PK ? PluralParamsFor<NormalizeKey<K>, Tr> : ParamsFor<K extends keyof Tr ? Tr[K] : PathValue<Tr, NormalizeKey<K>>>;
type I18nextHasParams<K extends string, Tr, PK extends string> = unknown extends K ? false : NormalizeKey<K> extends PK ? true : IsEmptyParams<I18nextParamsFor<K, Tr, PK>> extends true ? false : true;
type I18nextOptionsFor<K extends string, Tr, PK extends string> = I18nextParamsFor<K, Tr, PK> & I18nextOptions;
interface I18nextTranslation<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, Tr = TranslationObjectFor<undefined, T, Fallback>, PK extends string = PluralKeys<undefined, T, Fallback>> {
    <K extends I18nextKey<Tr, PK>>(key: K, ...args: I18nextHasParams<K, Tr, PK> extends true ? [options: I18nextOptionsFor<K, Tr, PK>] : [options?: I18nextOptions]): string;
    <K extends I18nextKey<Tr, PK>, D extends string = string>(key: K, defaultValue: D, ...args: (I18nextHasParams<K, Tr, PK> extends true ? true : IsEmptyParams<ParamsFor<D>> extends false ? true : false) extends true ? [options: I18nextOptionsFor<K, Tr, PK> & ParamsFor<D>] : [options?: I18nextOptions]): string;
    <D extends string>(key: string, defaultValue: D, ...args: IsEmptyParams<ParamsFor<D>> extends false ? [options: ParamsFor<D> & I18nextOptions] : [options?: I18nextOptions]): string;
    <D extends string>(key: string, options: {
        defaultValue: D;
    } & (IsEmptyParams<ParamsFor<D>> extends false ? ParamsFor<D> : {}) & I18nextOptions): string;
    (key: string, options: {
        ns: string;
    } & I18nextOptions): string;
}
interface I18nextCompat<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>, Tr = TranslationObjectFor<undefined, T, Fallback>, PK extends string = PluralKeys<undefined, T, Fallback>> {
    t: I18nextTranslation<T, Fallback, Tr, PK>;
    ordinal<K extends I18nextKey<Tr, PK>>(key: K, values: {
        count: number;
    } & InterpolationOptions): string;
    ordinal(key: string, values: {
        count: number;
    } & InterpolationOptions): string;
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
    dir(lng?: string): Direction;
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
