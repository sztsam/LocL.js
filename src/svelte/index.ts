import type { LocL } from "../LocL.js";

export function createLocLSvelte<T extends Record<string, any>, Fallback extends keyof T & string>(
  translator: LocL<T, Fallback, any, any, any>
) {
  return {
    subscribe(run: (t: LocL<T, Fallback, any>["t"]) => void) {
      run(translator.t.bind(translator));
      return translator.subscribe(() => {
        run(translator.t.bind(translator));
      });
    },
    translator
  };
}