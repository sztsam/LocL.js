import { L as LocL, U as Unsubscribe } from './LocL-Dnobyznm.js';

declare function createLocLSvelte<T extends Record<string, any>, Fallback extends keyof T & string>(translator: LocL<T, Fallback, any, any, any>): {
    subscribe(run: (t: LocL<T, Fallback, any>["t"]) => void): Unsubscribe;
    translator: LocL<T, Fallback, any, any, any, true>;
};

export { createLocLSvelte };
