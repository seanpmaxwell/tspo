import deepClone from './deepClone.js';
import isPlainObject, { Dict, POJO } from './isPlainObject.js';
import iterate from './iterate.js';
import {
  EntriesTuple,
  KeysParam,
  KeyTuple,
  KeyUnion,
  OmitKeys,
  PickKeys,
  SetToNever,
  ValueTuple,
} from './utility-types.js';

/******************************************************************************
                                       Types                                    
******************************************************************************/

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
 * Return a new object by excluding certains keys from an object.
 */
function omit<T extends POJO, K extends KeysParam<T>>(
  obj: T,
  keys: K,
): CollapseType<OmitKeys<T, K>> {
  const retVal: Dict = {},
    set = new Set(Array.isArray(keys) ? keys : [keys]);
  for (const key in obj) {
    if (!set.has(key)) {
      retVal[key] = (obj as Dict)[key];
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
  const retVal: Dict = {},
    set = new Set(Array.isArray(keys) ? keys : [keys]);
  for (const key in obj) {
    if (set.has(key)) {
      retVal[key] = (obj as Dict)[key];
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
    (obj as Dict)[key] = (addOn as Dict)[key];
  }
}

/**
 * Append a single entry to an object.
 */
function appendOne<T extends POJO, K extends string, V>(
  obj: T,
  entry: [K, V],
): asserts obj is CollapseTypeAlt<T & Record<K, V>> {
  (obj as Dict)[entry[0]] = entry[1];
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
    delete (obj as Dict)[key];
  }
}

/**
 * Get a value on an object and return 'undefined' if not found.
 */
function index<T extends object>(obj: T, key: string): T[keyof T] | undefined {
  return (obj as Dict)[key] as T[keyof T] | undefined;
}

/**
 * Get a value on an object and return 'undefined' if not found.
 */
function safeIndex<T extends object>(obj: T, key: string): T[keyof T] {
  if (key in obj) {
    return (obj as Dict)[key] as T[keyof T];
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
function keys<T extends object>(obj: T): KeyTuple<T> {
  return Object.keys(obj) as KeyTuple<T>;
}

/**
 * Get a type-safe array of the object values
 */
function values<T extends object>(obj: T): ValueTuple<T> {
  return Object.values(obj) as ValueTuple<T>;
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

/******************************************************************************
                                       Export                                    
******************************************************************************/

export default {
  is: isPlainObject,
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
