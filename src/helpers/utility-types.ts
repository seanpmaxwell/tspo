/******************************************************************************
                                       Types                                    
******************************************************************************/

export type TruthyObject = NonNullable<object>;
type Primitive = string | number | boolean | bigint | symbol | null | undefined;
export type Dict = Record<string, unknown>;

// ------------------------ Simple-Utilities ------------------------------- //

export type KeysParam<T extends object> = keyof T | (keyof T)[];

export type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

// Resolve key or array of keys of 'T'
export type KeyUnion<
  T extends object,
  K extends KeysParam<T>,
> = K extends (keyof T)[] ? K[number] : K;

export type OmitKeys<T extends object, K extends KeysParam<T>> = Omit<
  T,
  KeyUnion<T, K>
>;

export type PickKeys<T extends object, K extends KeysParam<T>> = Pick<
  T,
  KeyUnion<T, K>
>;

// Get a union of the entries
export type Entry<T extends object> = T extends object
  ? {
      [K in keyof T]-?: [K, T[K]];
    }[keyof T]
  : never;

// -------------------- Set/Remove 'never' keys --------------------------- //

export type SetToNever<T, K extends PropertyKey> = T & {
  [P in K]: never;
};

// Keys whose value type is not `never`
type NonNeverKeys<T extends object> = {
  [K in keyof T]-?: [T[K]] extends [never] ? never : K;
}[keyof T];

// Pick only entries whose values are not `never`
export type OmitNever<T extends object> = Pick<T, NonNeverKeys<T>>;

// ------------------------------ UnionToTuple ----------------------------- //

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never;

type LastOf<U> =
  UnionToIntersection<U extends any ? () => U : never> extends () => infer L
    ? L
    : never;

type UnionToTuple<U, R extends any[] = []> = [U] extends [never]
  ? R
  : UnionToTuple<Exclude<U, LastOf<U>>, [LastOf<U>, ...R]>;

type Entries<T extends object> = {
  [K in keyof T]-?: [K, T[K]];
}[keyof T];

export type EntriesTuple<T extends object> = UnionToTuple<Entries<T>>;
export type KeyTuple<T extends object> = UnionToTuple<keyof T>;
export type ValueTuple<T extends object> = UnionToTuple<T[keyof T]>;

// -------------------------- Deep Widen ----------------------------------- //

type WidenPrimitive<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends bigint
        ? bigint
        : T extends symbol
          ? symbol
          : T;

export type DeepWiden<T> = T extends Primitive
  ? WidenPrimitive<T>
  : T extends (...args: any[]) => any
    ? T
    : T extends readonly (infer U)[]
      ? DeepWiden<U>[]
      : T extends object
        ? { [K in keyof T]: DeepWiden<T[K]> }
        : T;

// ---------------------------- AddEntries --------------------------------- //

export type EntryToAdd = readonly [PropertyKey, unknown];

export type AddEntries<
  T extends object,
  Entries extends readonly EntryToAdd[],
> = T & {
  [K in Entries[number] as K[0]]: Extract<
    Entries[number],
    readonly [K[0], unknown]
  >[1];
};

// --------------------------- MergeArray ---------------------------------- //

type UnionKeys<U extends object> = U extends unknown ? keyof U : never;

type UnionValuesForKey<
  U extends object,
  K extends PropertyKey,
> = U extends unknown ? (K extends keyof U ? U[K] : never) : never;

type MergeUnion<U extends object> = [UnionKeys<U>] extends [never]
  ? Dict
  : {
      [K in UnionKeys<U>]: UnionValuesForKey<U, K>;
    };

export type MergeArray<A extends readonly TruthyObject[]> = MergeUnion<
  A[number]
>;
