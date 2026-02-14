import isPlainObject, { type PlainObject } from './helpers/isPlainObject.js';
import type {
  AddEntries,
  DeepWiden,
  Dict,
  EntriesTuple,
  Entry,
  EntryToAdd,
  KeysParam,
  KeyTuple,
  KeyUnion,
  MergeArray,
  OmitKeys,
  PickKeys,
  SetToNever,
  ValueTuple,
} from './helpers/utility-types.js';
import compare from './utils/compare.js';
import copy from './utils/copy.js';
import iterate from './utils/iterate.js';

/******************************************************************************
                                     Constants                                  
******************************************************************************/

const hop = Object.prototype.hasOwnProperty;

/******************************************************************************
                                       Types                                    
******************************************************************************/

// Must be defined in the file it is used in
type CollapseType<T> = {
  -readonly [K in keyof T]: T[K];
} & {};

/******************************************************************************
                                     Functions                                    
******************************************************************************/

/**
 * Return a new object by excluding certains keys from an object.
 */
function omit<T extends PlainObject, K extends KeysParam<T>>(
  obj: T,
  keys: K,
): CollapseType<OmitKeys<T, K>> {
  const retVal: Dict = {};
  const dict = obj as Dict;
  if (Array.isArray(keys)) {
    const set = new Set(keys as readonly PropertyKey[]);
    for (const key in obj) {
      if (!set.has(key)) {
        retVal[key] = dict[key];
      }
    }
    return retVal as any;
  }
  const omittedKey = keys as PropertyKey;
  for (const key in obj) {
    if (key !== omittedKey) {
      retVal[key] = dict[key];
    }
  }
  return retVal as any;
}

/**
 * Return a new object by selecting a specific set of keys on an object.
 */
function pick<T extends PlainObject, K extends KeysParam<T>>(
  obj: T,
  keys: K,
): CollapseType<PickKeys<T, K>> {
  const retVal: Dict = {};
  const dict = obj as Dict;
  if (Array.isArray(keys)) {
    const set = new Set(keys as readonly PropertyKey[]);
    for (const key in obj) {
      if (set.has(key)) {
        retVal[key] = dict[key];
      }
    }
    return retVal as any;
  }
  const pickedKey = keys as PropertyKey;
  for (const key in obj) {
    if (key === pickedKey) {
      retVal[key] = dict[key];
    }
  }
  return retVal as any;
}

/**
 * Merge two object together and return a new type.
 */
function merge<T extends PlainObject, U extends PlainObject>(
  a: T,
  b: U,
): CollapseType<Omit<T, keyof U> & U> {
  return { ...a, ...b };
}

/**
 * Merge an array of objects together
 */
function mergeArray<const A extends readonly PlainObject[]>(
  arr: A,
): CollapseType<MergeArray<A>> {
  return Object.assign({}, ...arr) as any;
}

/**
 * Fill the missing entries in a partial, will the values from a 'defaults'
 * object.
 */
function fill<const T extends object>(
  defaults: T,
  partial?: Partial<DeepWiden<T>>,
): CollapseType<DeepWiden<T>> {
  return { ...defaults, ...(partial ?? {}) } as any;
}

/**
 * Append a single entry to an object.
 */
function addEntry<T extends PlainObject, K extends string, V>(
  obj: T,
  entry: [K, V],
): CollapseType<T & Record<K, V>> {
  return { ...obj, [entry[0]]: entry[1] } as any;
}

/**
 * Append a single entry to an object.
 */
function addEntries<
  T extends PlainObject,
  const E extends readonly EntryToAdd[],
>(obj: T, entries: E): CollapseType<DeepWiden<AddEntries<T, E>>> {
  return {
    ...obj,
    ...Object.fromEntries(entries as any),
  } as any;
}

/**
 * Append one object to another, modifying the reference to the original
 * object.
 */
function append<T extends PlainObject, U extends PlainObject>(
  obj: T,
  addOn: U,
): asserts obj is CollapseType<T & U> {
  for (const key in addOn) {
    (obj as Dict)[key] = (addOn as Dict)[key];
  }
}

/**
 * Remove keys from an object and set the type to 'never'.
 */
function remove<T extends PlainObject, K extends KeysParam<T>>(
  obj: T,
  keys: K,
): asserts obj is CollapseType<SetToNever<T, KeyUnion<T, K>>> {
  const keyArr = Array.isArray(keys) ? keys : [keys];
  for (const key of keyArr) {
    delete (obj as Dict)[key];
  }
}

/**
 * Get a value on an object and return 'undefined' if not found.
 */
function index<T extends PlainObject>(
  obj: T,
  key: string | number,
): T[keyof T] | undefined {
  return (obj as Dict)[key] as any;
}

/**
 * Get a value on an object and return 'undefined' if not found.
 */
function safeIndex<T extends PlainObject>(
  obj: T,
  key: string | number,
): T[keyof T] {
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
function reverseIndex<T extends PlainObject>(
  obj: T,
  value: unknown,
): (keyof T)[] {
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
function safeReverseIndex<T extends PlainObject>(
  obj: T,
  value: unknown,
): keyof T {
  let found = false;
  let retVal!: keyof T;
  for (const key in obj) {
    if (obj[key] === value) {
      if (found) {
        throw new Error(
          '.safeReverseIndex found 0 or more than 1 keys for value: ' +
            String(value),
        );
      }
      found = true;
      retVal = key;
    }
  }
  if (!found) {
    throw new Error(
      '.safeReverseIndex found 0 or more than 1 keys for value: ' +
        String(value),
    );
  }
  return retVal;
}

/**
 * Validator function to check
 */
function isKey<T extends PlainObject>(
  obj: T,
  arg: PropertyKey,
): arg is keyof T {
  const keyArr = Array.isArray(arg) ? arg : [arg];
  for (const key of keyArr) {
    if (!(typeof arg === 'string' && arg in obj)) return false;
  }
  return true;
}

/**
 * Validator function to check
 */
function isValue<T extends PlainObject>(
  obj: T,
  arg: unknown,
): arg is T[keyof T] {
  const dict = obj as Dict;
  if (!Array.isArray(arg)) {
    for (const key in obj) {
      if (hop.call(obj, key) && sameValueZero(dict[key], arg)) return true;
    }
    return false;
  }
  for (const val of arg) {
    let found = false;
    for (const key in obj) {
      if (hop.call(obj, key) && sameValueZero(dict[key], val)) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

/**
 * @private
 * @see isValue
 */
function sameValueZero(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}

/**
 * Get a type-safe array of the object keys.
 */
function keys<T extends PlainObject>(obj: T): KeyTuple<T> {
  return Object.keys(obj) as any;
}

/**
 * Get a type-safe array of the object values
 */
function values<T extends PlainObject>(obj: T): ValueTuple<T> {
  return Object.values(obj) as any;
}

/**
 * Get a type-safe array of the object entries
 */
function entries<T extends PlainObject>(obj: T): EntriesTuple<T> {
  return Object.entries(obj) as any;
}

/**
 * Get a type-safe array of the object e
 */
function firstEntry<T extends PlainObject>(obj: T): Entry<T> {
  const dict = obj as Dict;
  for (const key in obj) {
    if (hop.call(obj, key)) {
      return [key, dict[key]] as any;
    }
  }
  return undefined as any;
}

/**
 * Check if something is a plain
 */
function toDict(obj: unknown): Dict {
  if (!isPlainObject(obj)) {
    throw new Error('value passed to ".toDict" was not a plain-object');
  }
  return obj as Dict;
}

/**
 * Check if something is a plain
 */
function coerce<T extends PlainObject>(obj: unknown): T {
  if (!isPlainObject(obj)) {
    throw new Error('value passed to ".coerce" was not a plain-object');
  }
  return obj as T;
}

/******************************************************************************
                                       Export                                    
******************************************************************************/

export default {
  omit,
  pick,
  merge,
  mergeArray,
  fill,
  append,
  addEntry,
  addEntries,
  index,
  remove,
  toDict,
  coerce,
  safeIndex,
  reverseIndex,
  safeReverseIndex,
  is: isPlainObject,
  isKey,
  isValue,
  keys,
  values,
  entries,
  firstEntry,
  iterate,
  copy,
  compare,
} as const;
