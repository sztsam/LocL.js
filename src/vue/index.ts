import type { LocL } from "../LocL.js";

export interface VueStoreLike<T> {
  value: T;
}

export function createLocLVue<T extends Record<string, any>, Fallback extends keyof T & string>(
  translator: LocL<T, Fallback, any, any, any>,
  shallowRefFn?: <V>(val: V) => VueStoreLike<V>
) {
  const makeRef = shallowRefFn ?? (<V>(val: V) => {
    let _val = val;
    return {
      get value() { return _val; },
      set value(v: V) { _val = v; }
    };
  });

  const langRef = makeRef(translator.getLanguage());
  const tRef = makeRef(translator.t.bind(translator));

  translator.subscribe((newLang) => {
    langRef.value = newLang;
    tRef.value = translator.t.bind(translator);
  });

  return {
    t: translator.t.bind(translator),
    language: langRef,
    translator
  };
}