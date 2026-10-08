import { LocL } from "../LocL.js";
import { NestedKeyOf, InterpolationOptions } from "../types.js";
import { DefaultResources, DefaultFallback } from "../react/index.js";

/**
 * Key type that supports both colon syntax (`auth:login`) and dotted syntax (`auth.login`).
 */
export type I18nextKey<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}:${NestedKeyOf<T[K]>}` | `${K}.${NestedKeyOf<T[K]>}` | `${K}`
        : `${K}`;
    }[keyof T & string] | NestedKeyOf<T>
  : string;

export interface I18nextOptions extends InterpolationOptions {
  ns?: string;
  defaultValue?: string;
  count?: number;
  [key: string]: any;
}

export interface I18nextCompat<
  T extends Record<string, any> = DefaultResources,
  Fallback extends keyof T & string = DefaultFallback<T>
> {
  t<K extends (I18nextKey<T[Fallback]> | (string & {}))>(
    key: K,
    options?: I18nextOptions
  ): string;
  t<K extends (I18nextKey<T[Fallback]> | (string & {}))>(
    key: K,
    defaultValue?: string,
    options?: I18nextOptions
  ): string;
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

/**
 * Wraps a LocL instance in an i18next-compatible interface.
 * Supports both colon (`common:login`) and dotted namespaces with full IDE autocomplete.
 */
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

  const compat: I18nextCompat<T, Fallback> = {
    translator,

    t(key: string, arg1?: any, arg2?: any): string {
      let defaultValue: string | undefined;
      let options: I18nextOptions = {};

      if (typeof arg1 === "string") {
        defaultValue = arg1;
        options = typeof arg2 === "object" && arg2 !== null ? arg2 : {};
      } else if (typeof arg1 === "object" && arg1 !== null) {
        options = arg1;
        defaultValue = options.defaultValue;
      }

      // Handle colon namespace syntax, e.g. "common:login"
      let lookupKey = key;
      let ns = options.ns;

      if (key.includes(":")) {
        const colonIdx = key.indexOf(":");
        ns = key.slice(0, colonIdx);
        lookupKey = key.slice(colonIdx + 1);
      }

      // Type as LocL<any, any, any> to avoid generic union call issues
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
    },

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

    addResourceBundle(lng: string, ns: string, resources: any, deep?: boolean, overwrite?: boolean): void {
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