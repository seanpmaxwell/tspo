import deepClone from './deepClone.js';
import {
  EntriesTuple,
  KeysParam,
  KeyUnion,
  OmitKeys,
  PickKeys,
  SetToNever,
} from './utility-types.js';

/******************************************************************************
                                       Constants                                    
******************************************************************************/

const objectProto = Object.prototype;

/******************************************************************************
                                       Types                                    
******************************************************************************/

// Basic Types
export type StrPOJO = { [key: string]: unknown };
export type POJO = NonNullable<object>;
type Path = readonly (string | number)[];

export type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined;

// Callback for the iterate function
type IterateCb = (args: {
  parent: POJO;
  key: string;
  value: unknown;
  path: Path; // path to the parent object
}) => void;

// -------------------------- Complex-Utilities ---------------------------- //

// Must be defined in the file it is used in
type CollapseType<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

// Must be defined in the file it is used in
type CollapseTypeAlt<T> = {
  [K in keyof T]: T[K];
} & {};

/******************************************************************************
                                     Functions                                    
******************************************************************************/

/**
 * Check if a 'unknown' is a 'PlainObject.
 */
function isPojo(arg: unknown): arg is POJO {
  if (arg === null || typeof arg !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(arg);
  return proto === objectProto || proto === null;
}

/**
 * Return a new object by excluding certains keys from an object.
 */
function omit<T extends POJO, K extends KeysParam<T>>(
  obj: T,
  keys: K,
): CollapseType<OmitKeys<T, K>> {
  const retVal: StrPOJO = {},
    set = new Set(Array.isArray(keys) ? keys : [keys]);
  for (const key in obj) {
    if (!set.has(key)) {
      retVal[key] = (obj as StrPOJO)[key];
    }
  }
  return retVal as CollapseType<OmitKeys<T, K>>;
}

/**
 * Return a new object by selecting a specific set of keys on an object.
 */
function pick<T extends POJO, K extends KeysParam<T>>(
  obj: T,
  keys: K,
): CollapseType<PickKeys<T, K>> {
  const retVal: StrPOJO = {},
    set = new Set(Array.isArray(keys) ? keys : [keys]);
  for (const key in obj) {
    if (set.has(key)) {
      retVal[key] = (obj as StrPOJO)[key];
    }
  }
  return retVal as CollapseType<PickKeys<T, K>>;
}

/**
 * Merge two object together and return a new type.
 */
function merge<T extends POJO, U extends POJO>(
  a: T,
  b: U,
): CollapseTypeAlt<T & U> {
  return { ...a, ...b };
}

/**
 * Append one object to another, modifying the reference to the original
 * object.
 */
function append<T extends POJO, U extends POJO>(
  obj: T,
  addOn: U,
): asserts obj is CollapseTypeAlt<T & U> {
  for (const key in addOn) {
    (obj as StrPOJO)[key] = (addOn as StrPOJO)[key];
  }
}

/**
 * Append a single entry to an object.
 */
function appendOne<T extends POJO, K extends string, V>(
  obj: T,
  entry: [K, V],
): asserts obj is CollapseTypeAlt<T & Record<K, V>> {
  (obj as StrPOJO)[entry[0]] = entry[1];
}

/**
 * Remove keys from an object and set the type to 'never'.
 */
function remove<T extends POJO, K extends KeysParam<T>>(
  obj: T,
  keys: K,
): asserts obj is CollapseTypeAlt<SetToNever<T, KeyUnion<T, K>>> {
  const keyArr = Array.isArray(keys) ? keys : [keys];
  for (const key of keyArr) {
    delete (obj as StrPOJO)[key];
  }
}

/**
 * Get a value on an object and return 'undefined' if not found.
 */
function index<T extends object>(obj: T, key: string): T[keyof T] | undefined {
  return (obj as StrPOJO)[key] as T[keyof T] | undefined;
}

/**
 * Get a value on an object and return 'undefined' if not found.
 */
function safeIndex<T extends object>(obj: T, key: string): T[keyof T] {
  if (key in obj) {
    return (obj as StrPOJO)[key] as T[keyof T];
  } else {
    throw new Error(
      'safeIndex was passed a key not present on the object. key: ' + key,
    );
  }
}

/**
 * Get a list of keys for which the value matches.
 */
function reverseIndex<T extends object>(obj: T, value: unknown): (keyof T)[] {
  const retVal = [];
  for (const key in obj) {
    if (obj[key] === value) {
      retVal.push(key);
    }
  }
  return retVal;
}

/**
 * Get a key for a value only if you know the value is unique.
 */
function safeReverseIndex<T extends object>(obj: T, value: unknown): keyof T {
  const retVal = [];
  for (const key in obj) {
    if (obj[key] === value) {
      retVal.push(key);
    }
  }
  if (retVal.length !== 1) {
    throw new Error(
      '.safeReverseIndex found 0 or more than 1 keys for value: ' +
        String(value),
    );
  }
  return retVal[0];
}

/**
 * Fill the missing entries in a partial, will the values from a 'defaults'
 * object.
 */
function fill<T extends object>(defaults: T, partial?: Partial<T> | null): T {
  return { ...defaults, ...(partial ?? {}) };
}

/**
 * Validator function to check
 */
function isKey<T extends object>(obj: T, arg: PropertyKey): arg is keyof T {
  const keyArr = Array.isArray(arg) ? arg : [arg];
  for (const key of keyArr) {
    if (!(typeof arg === 'string' && arg in obj)) return false;
  }
  return true;
}

/**
 * Validator function to check
 */
function isValue<T extends object>(obj: T, arg: unknown): arg is T[keyof T] {
  const valArr = Array.isArray(arg) ? arg : [arg],
    valSet = new Set(Object.values(obj));
  for (const val of valArr) {
    if (!valSet.has(val)) return false;
  }
  return true;
}

/**
 * Get a type-safe array of the object keys.
 */
function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Get a type-safe array of the object values
 */
function values<T extends object>(obj: T): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}

/**
 * Get a type-safe array of the object entries
 */
function entries<T extends object>(obj: T): EntriesTuple<T> {
  return Object.entries(obj) as EntriesTuple<T>;
}

/**
 * Get a type-safe array of the object e
 */
function firstEntry<T extends object, K extends keyof T>(obj: T): [K, T[K]] {
  return Object.entries(obj)[0] as [K, T[K]];
}

/**
 * Recursively walks only "plain objects" (as defined by isPlainObject),
 * and calls `onNonPlain` for every key whose value is NOT a plain object.
 *
 * - Descends into a value only if isPlainObject(value) === true.
 * - Fires callback for *every* non-plain value encountered as a property value.
 */
function iterate(root: unknown, cb: IterateCb): void {
  if (!isPojo(root)) return;
  interateHelper(root, [], cb);
}

/**
 * @private
 * @see iterate
 */
function interateHelper(
  node: POJO,
  path: (string | number)[],
  cb: IterateCb,
): void {
  for (const [key, value] of Object.entries(node)) {
    if (isPojo(value)) {
      interateHelper(value, [...path, key], cb);
    } else {
      cb({ parent: node, key, value, path });
    }
  }
}

/******************************************************************************
                                       Export                                    
******************************************************************************/

export default {
  is: isPojo,
  omit,
  pick,
  merge,
  append,
  appendOne,
  index,
  remove,
  safeIndex,
  reverseIndex,
  safeReverseIndex,
  isKey,
  isValue,
  keys,
  values,
  entries,
  firstEntry,
  fill,
  iterate,
  clone: deepClone,
} as const;
