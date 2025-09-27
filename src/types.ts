type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & string]: ObjectType[Key] extends any[]
    ? `${Key}`
    : ObjectType[Key] extends object
      ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
      : `${Key}`;
}[keyof ObjectType & string];

export type NestedKeyOfObj<ObjectType extends object, SkipArrays extends boolean = false> = {
  [Key in keyof ObjectType & string]: ObjectType[Key] extends Array<any>
    ? SkipArrays extends true
      ? never
      : `${Key}` | `${Key}.${number}`
    : ObjectType[Key] extends object
      ? `${Key}` | `${Key}.${NestedKeyOfObj<ObjectType[Key], SkipArrays>}`
      : never
}[keyof ObjectType & string];

export type PathValue<T, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends string
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends
    ((k: infer I) => void) ? I : never;

type DeepPick<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? { [Key in K]: DeepPick<T[K], Rest> }
    : never
  : P extends keyof T
    ? { [Key in P]: T[P] }
    : never;

type DeepPickValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends ""
      ? { [Key in K]: T[K] }
      : { [Key in K]: DeepPickValue<T[K], Rest> }
    : never
  : P extends keyof T
    ? { [Key in P]: T[P] }
    : never;

type Join<P extends string, K extends string> = P extends "" ? K : `${P}.${K}`;

type Resources<T extends Record<string, any>> = T;
export type Language<T extends Record<string, any>> = keyof T & string;
type FallbackLanguage<T extends Record<string, any>, Fallback extends keyof T> = Fallback;
type Scope<T extends Record<string, any>, Fallback extends keyof T> = NestedKeyOfObj<T[Fallback], true>;
export type ScopeType<T extends Record<string, any>, F extends keyof T> = Scope<T, F> | Scope<T, F>[] | undefined;
type EnsureObject<T> = T extends object ? T : {};

export type TranslationObjectFor<
  S extends Scope<T, Fallback> | Scope<T, Fallback>[] | undefined,
  T extends Record<string, any>,
  Fallback extends keyof T
> =
  S extends undefined
    ? EnsureObject<T[Fallback]>
    : S extends Scope<T, Fallback>
      ? EnsureObject<PathValue<T[Fallback], S>>
      : S extends Scope<T, Fallback>[]
        ? EnsureObject<UnionToIntersection<DeepPick<T[Fallback], S[number]>>>
        : never;

type Translations<S extends ScopeType<T, F>, T extends Record<string, any>, F extends keyof T & string> = TranslationObjectFor<S, T, F>;

type PluralForms = "zero" | "one" | "two" | "few" | "many" | "other";
export type PluralKeys<S extends ScopeType<T, F>, T extends Record<string, any>, F extends keyof T & string> = ExtractPluralKeys<Translations<S, T, F>>;
type ExtractPluralKeys<T, Path extends string = "", Depth extends any[] = []> =
// If the depth has reached a certain limit, stop recursing at the max value 32.
  Depth['length'] extends 32 ? never :
  T extends object ? {
    [K in keyof T & string]:
      T[K] extends Partial<Record<PluralForms, string>>
        ? Path extends ""
          ? K
          : `${Path}.${K}`
        : K extends `${infer Base}_one`
          ? `${Base}_other` extends keyof T
            ? Path extends ""
              ? Base
              : `${Path}.${Base}`
            : never
          : T[K] extends object
            ? ExtractPluralKeys<T[K], Path extends "" ? K : `${Path}.${K}`, [...Depth, 1]>
            : never
}[keyof T & string] : never;

export interface InterpolationOptions {
  [key: string]: string | number | Date | undefined;
  count?: number;
}
export interface PluralInterpolationOptions extends InterpolationOptions {
  count: number;
}
export interface FormatOptions<F extends Record<string, Formatter>, UseDefaultFormatter extends boolean> {
  formatter: keyof EffectiveFormatters<F, UseDefaultFormatter>;
  args?: string[]
}
export type Formatter<TArgs extends unknown[] = string[]> = (value: any, args?: TArgs) => string;
import type { DefaultFormatters } from "./formatters";
export type EffectiveFormatters<F extends Record<string, Formatter>, UseDefault extends boolean> = UseDefault extends true ? F & DefaultFormatters : F;



// - Language file typings
//type PluralForms = "zero" | "one" | "two" | "few" | "many" | "other";
type RequiredPlural = "one" | "other";
type OptionalPlural = Exclude<PluralForms, RequiredPlural>;
type ObjectPlural = {
  [K in RequiredPlural]: string;
} & Partial<Record<OptionalPlural, string>>;
type Primitive = string | number | boolean | null | undefined;
type StrKey<T> = Extract<keyof T, string>;
type PluralObjectKeys<T> = {
  [K in StrKey<T>]: T[K] extends object
    ? Extract<keyof T[K], PluralForms> extends never ? never : K
    : never;
}[StrKey<T>];
type SuffixKey<T> = Extract<StrKey<T>, `${string}_${PluralForms}`>;
type SuffixBaseUnion<T> = SuffixKey<T> extends `${infer B}_${PluralForms}` ? B : never;
type NamespaceKeys<T> = {
  [K in StrKey<T>]: T[K] extends object
    ? Extract<keyof T[K], PluralForms> extends never ? K : never
    : never;
}[StrKey<T>];
type PlainStringKeys<T> = {
  [K in StrKey<T>]: K extends SuffixKey<T>
    ? never
    : T[K] extends string
      ? K
      : never;
}[StrKey<T>];

export type LangWithPlurals<T> =
  // 1. If primitive → keep original type
  T extends Primitive ? T :
  // 2. If array → recursively handle each type
  T extends (infer U)[] ? LangWithPlurals<U>[] :
  // 3. Namespace and plurals handle
  {
    [K in NamespaceKeys<T>]: LangWithPlurals<T[K]>;
  } & {
    [K in PluralObjectKeys<T>]: ObjectPlural;
  } & {
    [B in SuffixBaseUnion<T> as `${B}_${RequiredPlural}`]: string;
  } & {
    [B in SuffixBaseUnion<T> as `${B}_${OptionalPlural}`]?: string;
  } & {
    [K in PlainStringKeys<T>]: string;
  } & {
  // 4. Keep primitive typed keys for autocomplete
    [K in Exclude<StrKey<T>, NamespaceKeys<T> | PluralObjectKeys<T> | PlainStringKeys<T> | SuffixKey<T>>]: T[K];
  };