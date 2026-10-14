import type { DefaultFormatters } from "./formatters.js";

/* =========================================================================
 * Path & Key Resolution Types (Internal & Package Core)
 * ========================================================================= */

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NestedKeyOf<ObjectType extends object, Depth extends number = 8, UsedDepth extends any[] = []> =
  UsedDepth['length'] extends Depth
    ? never
    : {
      [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends any[]
        ? `${Key}`
        : ObjectType[Key] extends object
          ? IsPluralObject<ObjectType[Key]> extends true
            ? `${Key}`
            : `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key], Depth, [...UsedDepth, any]>}`
          : `${Key}`;
    }[keyof ObjectType & (string | number)];

export type NestedKeyOfObj<ObjectType extends object, SkipArrays extends boolean = false, Depth extends number = 8, UsedDepth extends any[] = []> =
  UsedDepth['length'] extends Depth
    ? never
    : {
      [Key in keyof ObjectType & string]: ObjectType[Key] extends Array<any>
        ? SkipArrays extends true
          ? never
          : `${Key}` | `${Key}.${number}`
        : ObjectType[Key] extends object
          ? IsPluralObject<ObjectType[Key]> extends true
            ? never
            : `${Key}` | `${Key}.${NestedKeyOfObj<ObjectType[Key], SkipArrays, Depth, [...UsedDepth, any]>}`
          : never
    }[keyof ObjectType & string];

export type PathValue<T, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? PathValue<T[Key], Rest>
    : Key extends `${infer N extends number}`
      ? N extends keyof T
        ? PathValue<T[N], Rest>
        : never
      : never
  : P extends keyof T
    ? T[P]
    : P extends `${infer N extends number}`
      ? N extends keyof T
        ? T[N]
        : never
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


/* =========================================================================
 * Language, Scope & Resource Types
 * ========================================================================= */

type Resources<T extends Record<string, any>> = T;
export type Language<T extends Record<string, any>> = keyof T & string;
type FallbackLanguage<T extends Record<string, any>, Fallback extends keyof T> = Fallback;
export type Scope<T extends Record<string, any>, Fallback extends keyof T> = NestedKeyOfObj<T[Fallback], true>;
export type ScopeType<T extends Record<string, any>, F extends keyof T> = Scope<T, F> | Scope<T, F>[] | undefined;
type EnsureObject<T> = T extends object ? T : {};

export type TranslationObjectFor<
  S extends Scope<T, Fallback> | Scope<T, Fallback>[] | undefined,
  T extends Record<string, any>,
  Fallback extends keyof T
> =
  [S] extends [undefined]
    ? EnsureObject<T[Fallback]>
    : [S] extends [Scope<T, Fallback>]
      ? EnsureObject<PathValue<T[Fallback], S>>
      : [S] extends [Scope<T, Fallback>[]]
        ? EnsureObject<UnionToIntersection<DeepPick<T[Fallback], S[number]>>>
        : EnsureObject<T[Fallback]>;

type Translations<S extends ScopeType<T, F>, T extends Record<string, any>, F extends keyof T & string> = TranslationObjectFor<S, T, F>;


/* =========================================================================
 * Token & Interpolation Parsing Types (Internal)
 * ========================================================================= */

type Trim<T extends string> =
  T extends ` ${infer Rest}` ? Trim<Rest> :
  T extends `${infer Rest} ` ? Trim<Rest> :
  T;

type ExtractVarName<T extends string> =
  T extends `${infer Var}|${string}` ? Trim<Var> :
  T extends `${infer Var},${string}` ? Trim<Var> :
  Trim<T>;

type InterpolationValue = string | number | boolean | Date;
type Whitespace = " " | "\n" | "\t" | "\r";
type TrimStart<T extends string> = T extends `${Whitespace}${infer Rest}` ? TrimStart<Rest> : T;
type ReadBalanced<S extends string, Depth extends 1[] = [1], Acc extends string = ""> =
  S extends `${infer Before}}${infer After}`
    ? Before extends `${infer Head}{${infer Tail}`
      ? ReadBalanced<`${Tail}}${After}`, [...Depth, 1], `${Acc}${Head}{`>
      : Depth extends [1]
        ? [`${Acc}${Before}`, After]
        : Depth extends [1, ...infer Outer extends 1[]]
          ? ReadBalanced<After, Outer, `${Acc}${Before}}`>
          : null
    : null;
type Param<Name extends string, V> =
  Trim<Name> extends infer N extends string
    ? N extends "" ? {} : { [K in N]: V }
    : {};
type VariableParams<Raw extends string> = Param<ExtractVarName<Raw>, InterpolationValue>;
type TokenParams<Inner extends string> =
  Inner extends `{${infer Unwrapped}}` ? TokenBody<Unwrapped> : TokenBody<Inner>;
type TokenBody<Inner extends string> =
  Inner extends `${infer Field},${infer Rest}`
    ? TrimStart<Rest> extends `select${infer AfterKeyword}`
      ? TrimStart<AfterKeyword> extends `,${infer Cases}`
        ? Param<Field, string> & CaseParams<Cases>
        : VariableParams<Inner>
      : VariableParams<Inner>
    : VariableParams<Inner>;
type CaseParams<Cases extends string, Acc = {}> =
  Cases extends `${string}{${infer Rest}`
    ? ReadBalanced<Rest> extends [infer Body extends string, infer After extends string]
      ? CaseParams<After, Acc & ScanParams<Body>>
      : Acc
    : Acc;
type ScanParams<S extends string, Acc = {}> =
  S extends `${string}{${infer Rest}`
    ? ReadBalanced<Rest> extends [infer Inner extends string, infer After extends string]
      ? ScanParams<After, Acc & TokenParams<Inner>>
      : Acc
    : Acc;
export type ExtractInterpolationParams<T extends string> =
  string extends T
    ? { [key: string]: string | number | boolean | Date | undefined }
    : ScanParams<T>;

export type Simplify<T> = { [K in keyof T]: T[K] };
export type Direction = "ltr" | "rtl";
export type PluralForms = "zero" | "one" | "two" | "few" | "many" | "other";
export type ExactPluralForms = `=${number}`;
export type PluralKeyForms = PluralForms | ExactPluralForms;

type IsPluralObject<V> =
  [V] extends [object]
    ? [keyof V] extends [never]
      ? false
      : [keyof V] extends [PluralKeyForms] ? true : false
    : false;

type ParamUnion<T> = [keyof T] extends [never] ? never : T;
type ExtractPluralObjectParamsUnion<T> = {
  [K in keyof T]: T[K] extends string
    ? ParamUnion<ExtractInterpolationParams<T[K]>>
    : never;
}[keyof T];

export type ExtractPluralObjectParams<T> =
  [T] extends [never]
    ? never
    : T extends Record<string, any>
      ? Simplify<{ count: number } &
          ([UnionToIntersection<ExtractPluralObjectParamsUnion<T>>] extends [never]
            ? {}
            : UnionToIntersection<ExtractPluralObjectParamsUnion<T>>)
        >
      : never;

type ExtractSuffixParamsUnion<Base extends string, T> = {
  [K in keyof T & string]: K extends `${Base}_${PluralKeyForms}`
    ? T[K] extends string
      ? ParamUnion<ExtractInterpolationParams<T[K]>>
      : never
    : never;
}[keyof T & string];

type ExtractSuffixPluralParams<Base extends string, T> =
  Simplify<{ count: number } &
    ([UnionToIntersection<ExtractSuffixParamsUnion<Base, T>>] extends [never]
      ? {}
      : UnionToIntersection<ExtractSuffixParamsUnion<Base, T>>)
  >;


/* =========================================================================
 * Compiled Template Chunks (Execution Plan)
 * ========================================================================= */

export type FormatterCall = {
  name: string;
  args: string[];
};
export type TemplateChunk =
  | { type: "lit"; value: string }
  | { type: "var"; name: string; raw: string; formatters: FormatterCall[] }
  | { type: "select"; field: string; cases: Record<string, string> };


/* =========================================================================
 * Params & Plural Key Resolution Types (Package Core)
 * ========================================================================= */

export type PluralParamsFor<K extends string, T> =
  string extends K
    ? { count: number } & InterpolationOptions
    : string extends keyof T
      ? { count: number } & InterpolationOptions
      : [PathValue<T, K>] extends [never]
        ? ExtractSuffixPluralParams<K, T>
        : IsPluralObject<PathValue<T, K>> extends true
          ? ExtractPluralObjectParams<PathValue<T, K>>
          : ExtractSuffixPluralParams<K, T>;

export type ParamsFor<Val> =
  string extends Val
    ? InterpolationOptions
    : Val extends string
      ? Simplify<ExtractInterpolationParams<Val>>
      : IsPluralObject<Val> extends true
        ? ExtractPluralObjectParams<Val>
        : {};

export type IsEmptyParams<P> =
  [keyof P] extends [never]
    ? true
    : string extends keyof P
      ? true
      : false;

export type PluralKeys<S extends ScopeType<T, F>, T extends Record<string, any>, F extends keyof T & string> =
  string extends keyof Translations<S, T, F>
    ? string
    : ExtractPluralKeys<Translations<S, T, F>>;

type ExtractPluralKeys<T, Path extends string = "", Depth extends any[] = []> =
  Depth['length'] extends 16 ? never :
  T extends object ? {
    [K in keyof T & string]:
      (K extends `${infer Base}_${PluralKeyForms}`
        ? Path extends "" ? Base : `${Path}.${Base}`
        : never)
      |
      (T[K] extends object
        ? IsPluralObject<T[K]> extends true
          ? Path extends "" ? K : `${Path}.${K}`
          : ExtractPluralKeys<T[K], Path extends "" ? K : `${Path}.${K}`, [...Depth, 1]>
        : never)
  }[keyof T & string] : never;


/* =========================================================================
 * Pre-Flattened Utilities for Large Dictionaries
 * ========================================================================= */

export type FlattenKeys<T, Depth extends number = 8, UsedDepth extends any[] = []> =
  UsedDepth['length'] extends Depth
    ? never
    : T extends object
      ? {
          [K in keyof T & (string | number)]: T[K] extends any[]
            ? `${K}`
            : T[K] extends object
              ? IsPluralObject<T[K]> extends true
                ? `${K}`
                : `${K}` | `${K}.${FlattenKeys<T[K], Depth, [...UsedDepth, any]>}`
              : `${K}`;
        }[keyof T & (string | number)]
      : never;

export type FlattenDictionary<T> = {
  [K in FlattenKeys<T>]: string;
};

export type PreFlattened<T> = FlattenDictionary<T>;


/* =========================================================================
 * Options & Function Signatures
 * ========================================================================= */

export interface InterpolationOptions {
  [key: string]: string | number | Date | boolean | undefined;
  count?: number;
}
export interface PluralInterpolationOptions extends InterpolationOptions {
  count: number;
}
export interface FormatOptions<F extends Record<string, Formatter>, UseDefaultFormatter extends boolean> {
  formatter: keyof EffectiveFormatters<F, UseDefaultFormatter>;
  args?: string[];
}
export type Formatter<TArgs extends unknown[] = string[]> = (value: any, args?: TArgs) => string;
export type EffectiveFormatters<F extends Record<string, Formatter>, UseDefault extends boolean> = UseDefault extends true ? F & DefaultFormatters : F;

export interface LocaleMetadata {
  language: string;
  direction: Direction;
  isRTL: boolean;
}

export type Subscriber<T extends Record<string, any>> = (language: Language<T>, prevLanguage: Language<T>, metadata: LocaleMetadata) => void;
export type Unsubscribe = () => void;

type TagFormatter<T = any> = (content: string) => T;
export type TagInterpolationOptions<T = any> = Record<string, TagFormatter<T> | string | number | Date | boolean | undefined>;

export type TArgs<K extends string, Tr, PK extends string, F extends Record<string, Formatter>, U extends boolean, StrictParams extends boolean = true> =
  StrictParams extends false
    ? [values?: InterpolationOptions, format?: FormatOptions<F, U>]
    : unknown extends K
      ? [values?: InterpolationOptions, format?: FormatOptions<F, U>]
      : string extends PK
        ? [values?: InterpolationOptions, format?: FormatOptions<F, U>]
        : K extends PK
          ? [values: PluralParamsFor<K, Tr>, format?: FormatOptions<F, U>]
          : IsEmptyParams<ParamsFor<PathValue<Tr, K>>> extends true
            ? [values?: InterpolationOptions, format?: FormatOptions<F, U>]
            : [values: ParamsFor<PathValue<Tr, K>> & InterpolationOptions, format?: FormatOptions<F, U>];

export type TResult<K extends string, Tr, PK extends string, StrictParams extends boolean = true> =
  StrictParams extends false
    ? string
    : string extends PK
      ? PathValue<Tr, K>
      : K extends PK ? string : PathValue<Tr, K>;

type DeepMerge<T, U> = T extends object
  ? U extends object
    ? {
        [K in keyof T | keyof U]: K extends keyof U
          ? K extends keyof T
            ? DeepMerge<T[K], U[K]>
            : U[K]
          : K extends keyof T
            ? T[K]
            : never;
      }
    : U
  : U;
export type DeepMergeResources<
  T extends Record<string, any>,
  L extends string,
  B extends Record<string, any>
> = L extends keyof T
  ? { [K in keyof T]: K extends L ? DeepMerge<T[K], B> : T[K] }
  : T & { [K in L]: B };

type LoadableBundle =
  | Record<string, any>
  | { default: Record<string, any> | (() => any) }
  | (() => Record<string, any> | Promise<Record<string, any>>)
  | Response
  | string;
export type ResourceLoader = (language: string, namespace?: string) => LoadableBundle | Promise<LoadableBundle>;

export interface PseudoLocalizationOptions {
  enabled?: boolean;
  prefix?: string;
  suffix?: string;
  accents?: boolean;
}


/* =========================================================================
 * Consumer Language Schema Typing (For lang files parity checking)
 * ========================================================================= */

type DeepParityMatch<Base, Target> = Base extends object
  ? {
      [K in keyof Base]: K extends keyof Target
        ? DeepParityMatch<Base[K], Target[K]>
        : never;
    }
  : Target;
export type EnforceParity<T, Fallback extends keyof T> = {
  [L in keyof T]: L extends Fallback
    ? T[L]
    : DeepParityMatch<T[Fallback], T[L]> & {
        [K in Exclude<keyof T[L], keyof T[Fallback]>]?: T[L][K];
      };
};


// - Language file typings
//type PluralForms = "zero" | "one" | "two" | "few" | "many" | "other";
//type ExactPluralForms = `=${number}`;
//type PluralKeyForms = PluralForms | ExactPluralForms;
type RequiredPlural = "one" | "other";
type OptionalPlural = Exclude<PluralForms, RequiredPlural>;
type ObjectPlural = {
  [K in RequiredPlural]: string;
} & Partial<Record<OptionalPlural, string>> & Partial<Record<ExactPluralForms, string>>;
type Primitive = string | number | boolean | null | undefined;
type StrKey<T> = Extract<keyof T, string | number>;
type PluralObjectKeys<T> = {
  [K in StrKey<T>]: T[K] extends object
    ? Extract<keyof T[K], PluralKeyForms> extends never ? never : K
    : never;
}[StrKey<T>];
type SuffixKey<T> = Extract<StrKey<T>, `${string}_${PluralKeyForms}`>;
type SuffixBaseUnion<T> = SuffixKey<T> extends `${infer B}_${PluralKeyForms}` ? B : never;
type NamespaceKeys<T> = {
  [K in StrKey<T>]: T[K] extends object
    ? Extract<keyof T[K], PluralKeyForms> extends never ? K : never
    : never;
}[StrKey<T>];
type PlainStringKeys<T> = {
  [K in StrKey<T>]: K extends SuffixKey<T>
    ? never
    : T[K] extends string
      ? K
      : never;
}[StrKey<T>];


/**
 * Type utility to strictly type-check secondary translation files against a fallback language object.
 * Enforces `one` and `other` plurals, makes non-essential grammatical plurals (`zero`, `few`, `many`) optional,
 * and recursively validates namespace structures.
 *
 * @example
 * ```ts
 * import { LangWithPlurals } from "locl-js";
 *
 * const en: LangWithPlurals<typeof en> = {
 *   messages: {
 *     one: "You have one message.",
 *     other: "You have {count} messages."
 *   }
 * };
 * ```
 */
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
    [B in SuffixBaseUnion<T> as `${B}_${ExactPluralForms}`]?: string;
  } & {
    [K in PlainStringKeys<T>]: T[K];
  } & {
  // 4. Keep primitive typed keys for autocomplete
    [K in Exclude<StrKey<T>, NamespaceKeys<T> | PluralObjectKeys<T> | PlainStringKeys<T> | SuffixKey<T>>]: T[K];
  };