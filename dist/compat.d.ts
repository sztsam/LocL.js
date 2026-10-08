import { N as NestedKeyOf, I as InterpolationOptions, a as LocL } from './LocL-ahF6uv53.js';
import { DefaultResources, DefaultFallback } from './react.js';
import 'react';

/**
 * Key type that supports both colon syntax (`auth:login`) and dotted syntax (`auth.login`).
 */
type I18nextKey<T> = T extends object ? {
    [K in keyof T & string]: T[K] extends object ? `${K}:${NestedKeyOf<T[K]>}` | `${K}.${NestedKeyOf<T[K]>}` | `${K}` : `${K}`;
}[keyof T & string] | NestedKeyOf<T> : string;
interface I18nextOptions extends InterpolationOptions {
    ns?: string;
    defaultValue?: string;
    count?: number;
    [key: string]: any;
}
interface I18nextCompat<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>> {
    t<K extends (I18nextKey<T[Fallback]> | (string & {}))>(key: K, options?: I18nextOptions): string;
    t<K extends (I18nextKey<T[Fallback]> | (string & {}))>(key: K, defaultValue?: string, options?: I18nextOptions): string;
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
    loadNamespaces(ns: string | string[], callback?: () => void): Promise<void>;
    translator: LocL<T, Fallback, any, any, any>;
}
/**
 * Wraps a LocL instance in an i18next-compatible interface.
 * Supports both colon (`common:login`) and dotted namespaces with full IDE autocomplete.
 */
declare function toI18next<T extends Record<string, any> = DefaultResources, Fallback extends keyof T & string = DefaultFallback<T>>(translator: LocL<T, Fallback, any, any, any>): I18nextCompat<T, Fallback>;
declare const createI18nextCompat: typeof toI18next;

export { type I18nextCompat, type I18nextKey, type I18nextOptions, createI18nextCompat, toI18next };
