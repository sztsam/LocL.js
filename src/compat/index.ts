import { LocL } from "../LocL.js";
import { NestedKeyOf, InterpolationOptions, PathValue, ParamsFor, IsEmptyParams, PluralParamsFor, PluralKeys, TranslationObjectFor } from "../types.js";
import { DefaultResources, DefaultFallback } from "../react/index.js";

export type NormalizeKey<K extends string> = K extends `${infer NS}:${infer Rest}`
  ? `${NS}.${Rest}`
  : K;

export type ColonKeys<K extends string> = K extends `${infer NS}.${infer Rest}`
  ? `${NS}:${Rest}` | `${NS}.${Rest}`
  : K;

export type BaseKeys<Tr, PK extends string> = ((Tr extends object ? NestedKeyOf<Tr> : never) | PK) & string;
export type I18nextKey<Tr, PK extends string> = ColonKeys<BaseKeys<Tr, PK>>;

export interface I18nextOptions extends InterpolationOptions {
  ns?: string;
  defaultValue?: string;
  count?: number;
}

export type I18nextParamsFor<K extends string, Tr, PK extends string> =
  NormalizeKey<K> extends PK
    ? PluralParamsFor<NormalizeKey<K>, Tr>
    : ParamsFor<PathValue<Tr, NormalizeKey<K>>>;

export type I18nextHasParams<K extends string, Tr, PK extends string> =
  NormalizeKey<K> extends PK
    ? true
    : IsEmptyParams<ParamsFor<PathValue<Tr, NormalizeKey<K>>>> extends true
      ? false
      : true;

export type I18nextOptionsFor<K extends string, Tr, PK extends string> =
  I18nextParamsFor<K, Tr, PK> & I18nextOptions;


export interface I18nextTranslation<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>,
  Tr = TranslationObjectFor<undefined, T, Fallback>,
  PK extends string = PluralKeys<undefined, T, Fallback>
> {
  // 1. Known key: options is REQUIRED if template has variables or is plural, OPTIONAL if static
  <K extends I18nextKey<Tr, PK>>(
    key: K,
    ...args: I18nextHasParams<K, Tr, PK> extends true
      ? [options: I18nextOptionsFor<K, Tr, PK>]
      : [options?: I18nextOptions]
  ): string;

  // 2. Known key with defaultValue string argument
  <K extends I18nextKey<Tr, PK>>(
    key: K,
    defaultValue: string,
    ...args: I18nextHasParams<K, Tr, PK> extends true
      ? [options: I18nextOptionsFor<K, Tr, PK>]
      : [options?: I18nextOptions]
  ): string;

  // 3. Fallback signature for dynamic keys ONLY when defaultValue string is provided
  (
    key: string,
    defaultValue: string,
    options?: I18nextOptions
  ): string;

  // 4. Fallback signature for dynamic keys ONLY when defaultValue is in options
  (
    key: string,
    options: { defaultValue: string } & I18nextOptions
  ): string;

  // 5. Dynamic key with explicit ns option
  (
    key: string,
    options: { ns: string } & I18nextOptions
  ): string;
}

export interface I18nextCompat<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>,
  Tr = TranslationObjectFor<undefined, T, Fallback>,
  PK extends string = PluralKeys<undefined, T, Fallback>
> {
  t: I18nextTranslation<T, Fallback>;
  exists<K extends I18nextKey<Tr, PK>>(key: K, options?: { ns?: string; [key: string]: any }): boolean;
  exists(key: string, options?: { ns?: string; [key: string]: any }): boolean;
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

export function toI18next<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>
>(translator: LocL<T, Fallback, any, any, any>): I18nextCompat<T, Fallback> {
  const listeners: Record<string, Set<(...args: any[]) => void>> = {};

  const emit = (event: string, ...args: any[]) => {
    listeners[event]?.forEach((cb) => {
      try {
        cb(...args);
      } catch (err) {
        console.error(`[LocL/compat] Error in event "${event}":`, err);
      }
    });
  };

  translator.subscribe((newLang, prevLang) => {
    emit("languageChanged", newLang, prevLang);
  });

  const tFunction = (key: string, arg1?: any, arg2?: any): string => {
    let defaultValue: string | undefined;
    let options: I18nextOptions = {};

    if (typeof arg1 === "string") {
      defaultValue = arg1;
      options = typeof arg2 === "object" && arg2 !== null ? arg2 : {};
    } else if (typeof arg1 === "object" && arg1 !== null) {
      options = arg1;
      defaultValue = options.defaultValue;
    }

    let lookupKey = key;
    let ns = options.ns;

    if (key.includes(":")) {
      const colonIdx = key.indexOf(":");
      ns = key.slice(0, colonIdx);
      lookupKey = key.slice(colonIdx + 1);
    }

    let activeTranslator: LocL<any, any, any> = translator;
    if (ns) {
      activeTranslator = translator.withConfig({ scope: ns } as any) as LocL<any, any, any>;
    }

    let result: string | undefined;
    if (typeof options.count === "number") {
      result = activeTranslator.plural(lookupKey as any, options as any) as string;
    } else {
      result = activeTranslator.t(lookupKey as any, options as any) as string;
    }

    const keyExists = (activeTranslator as any).get(lookupKey) !== undefined || result !== lookupKey;

    if (!keyExists && defaultValue !== undefined) {
      return defaultValue;
    }

    return result ?? defaultValue ?? key;
  };

  const compat: I18nextCompat<T, Fallback> = {
    translator,
    t: tFunction as I18nextTranslation<T, Fallback>,

    exists(key: string, options?: { ns?: string }): boolean {
      let lookupKey = key;
      let ns = options?.ns;

      if (key.includes(":")) {
        const colonIdx = key.indexOf(":");
        ns = key.slice(0, colonIdx);
        lookupKey = key.slice(colonIdx + 1);
      }

      const activeTranslator: LocL<any, any, any> = ns
        ? (translator.withConfig({ scope: ns } as any) as LocL<any, any, any>)
        : (translator as LocL<any, any, any>);

      return (activeTranslator as any).get(lookupKey) !== undefined;
    },

    get language(): string {
      return translator.getLanguage();
    },

    get languages(): string[] {
      return Object.keys((translator as any).resources ?? {});
    },

    async changeLanguage(lng: string, callback?: (err: any, t: any) => void): Promise<string> {
      translator.changeLanguage(lng as any);
      const current = translator.getLanguage();
      callback?.(null, compat.t.bind(compat));
      return current;
    },

    on(event: string, listener: (...args: any[]) => void): () => void {
      listeners[event] ??= new Set();
      listeners[event].add(listener);
      return () => {
        listeners[event]?.delete(listener);
      };
    },

    off(event: string, listener: (...args: any[]) => void): void {
      listeners[event]?.delete(listener);
    },

    addResource(lng: string, ns: string, key: string, value: any): void {
      translator.addResource(lng, `${ns}.${key}`, value);
    },

    addResources(lng: string, ns: string, resources: any): void {
      translator.addResources(lng, { [ns]: resources });
    },

    addResourceBundle(lng: string, ns: string, resources: any): void {
      translator.addResources(lng, { [ns]: resources });
    },

    hasResourceBundle(lng: string, ns: string): boolean {
      const langObj = (translator as any).resources?.[lng];
      return langObj?.[ns] !== undefined;
    },

    getResourceBundle(lng: string, ns: string): any {
      const langObj = (translator as any).resources?.[lng];
      return langObj?.[ns];
    },

    async loadNamespaces(ns: string | string[], callback?: () => void): Promise<void> {
      callback?.();
    }
  };

  return compat;
}

export const createI18nextCompat = toI18next;