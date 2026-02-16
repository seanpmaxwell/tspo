import isPlainObject from '../helpers/isPlainObject.js';
import type { Dict, Mutable, TruthyObject } from '../helpers/utility-types.js';

/******************************************************************************
                                  Constants
******************************************************************************/

const hop = Object.prototype.hasOwnProperty;

/******************************************************************************
                                     Types                                    
******************************************************************************/

// Must be defined in the file it is used in
type CollapseType<T> = {
  [K in keyof T]: T[K];
} & {};

type CopyReturn<T, O> = O extends { mutable: false } ? T : Mutable<T>;

interface CopyOptions {
  resetDates?: boolean;
  deepCloneAll?: boolean;
  mutable?: boolean;
}

/******************************************************************************
                                  Functions
******************************************************************************/

/**
 * Deep clones ONLY plain-objects (incl. null-prototype).
 *
 * - Root value must be a plain-object.
 * - Recursion descends only into plain-objects and arrays.
 * - Nested Date values are copied by epoch.
 * - `resetDates` resets all nested Date values to current time.
 * - Other nested non-plain objects are shallow-cloned by default.
 * - `deepCloneAll` deep-clones all nested object values.
 */
function copy<
  T extends TruthyObject,
  O extends CopyOptions | undefined = undefined,
>(value: T, options?: O): CollapseType<CopyReturn<T, O>> {
  if (!isPlainObject(value)) {
    throw new TypeError('.copy only accepts a plain-object as the root value');
  }
  const resetDates = options?.resetDates === true,
    deepCloneAll = options?.deepCloneAll === true;
  return clonePlainObject(
    value as Dict,
    Object.getPrototypeOf(value),
    resetDates,
    deepCloneAll,
  ) as any;
}

/**
 * @private
 *
 * Clone a plain-object.
 */
function clonePlainObject(
  source: object,
  proto: object | null,
  resetDates: boolean,
  deepCloneAll: boolean,
): Dict {
  const out: Dict = proto === null ? Object.create(null) : {};
  for (const key in source) {
    if (!hop.call(source, key)) continue;
    out[key] = cloneValue((source as Dict)[key], resetDates, deepCloneAll);
  }
  return out;
}

/**
 * @private
 *
 * Clone non plain-object value.
 */
function cloneValue(
  value: unknown,
  resetDates: boolean,
  deepCloneAll: boolean,
): unknown {
  if (isPlainObject(value)) {
    return clonePlainObject(
      value as Dict,
      Object.getPrototypeOf(value),
      resetDates,
      deepCloneAll,
    );
  }
  if (Array.isArray(value)) {
    return cloneArray(value, resetDates, deepCloneAll);
  }
  if (value instanceof Date) {
    if (resetDates) {
      return new Date();
    }
    return new Date(value.getTime());
  }
  if (typeof value === 'object' && value !== null) {
    if (deepCloneAll) {
      return cloneNonPlainDeep(value, resetDates);
    }
    return cloneNonPlainShallow(value);
  }
  return value;
}

/**
 * @private
 *
 * Clone an array.
 */
function cloneArray(
  source: readonly unknown[],
  resetDates: boolean,
  deepCloneAll: boolean,
): unknown[] {
  const len = source.length,
    out = new Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = cloneValue(source[i], resetDates, deepCloneAll);
  }
  return out;
}

/**
 * @private
 *
 * Shallow clone non-plain non-array object.
 */
function cloneNonPlainShallow<T>(value: T): T {
  if (value instanceof RegExp) {
    const re = new RegExp(value.source, value.flags);
    re.lastIndex = value.lastIndex;
    return re as T;
  }
  if (value instanceof Map) return new Map(value as any) as T;
  if (value instanceof Set) return new Set(value as any) as T;
  const clonedView = cloneArrayBufferView(value);
  if (clonedView !== undefined) return clonedView;
  if (value instanceof ArrayBuffer) return value.slice(0) as T;
  // Generic non-plain object: shallow clone own enumerable props (values as-is)
  const proto = Object.getPrototypeOf(value),
    out: any = Object.create(proto);
  for (const key in value as any) {
    if (hop.call(value, key)) out[key] = (value as any)[key];
  }
  return out as T;
}

/**
 * @private
 *
 * Deep clone non-plain non-array object.
 */
function cloneNonPlainDeep<T>(value: T, resetDates: boolean): T {
  if (value instanceof RegExp) {
    const re = new RegExp(value.source, value.flags);
    re.lastIndex = value.lastIndex;
    return re as T;
  }
  // Clone Map
  if (value instanceof Map) {
    const out = new Map();
    for (const [key, val] of value) {
      out.set(
        cloneValue(key, resetDates, true),
        cloneValue(val, resetDates, true),
      );
    }
    return out as T;
  }
  // Clone Set
  if (value instanceof Set) {
    const out = new Set();
    for (const entry of value) {
      out.add(cloneValue(entry, resetDates, true));
    }
    return out as T;
  }
  // Clone ArrayBuffers
  const clonedView = cloneArrayBufferView(value);
  if (clonedView !== undefined) return clonedView;
  if (value instanceof ArrayBuffer) return value.slice(0) as T;
  // Clone all others
  const proto = Object.getPrototypeOf(value),
    out: any = Object.create(proto);
  for (const key in value as any) {
    if (!hop.call(value, key)) continue;
    out[key] = cloneValue((value as any)[key], resetDates, true);
  }
  // Return
  return out as T;
}

/**
 * @private
 *
 * Clone an ArrayBuffer view.
 */
function cloneArrayBufferView<T>(value: T): T | undefined {
  if (!ArrayBuffer.isView(value)) return undefined;
  const anyVal: any = value as any;
  if (typeof anyVal.slice === 'function') return anyVal.slice() as T;
  if (value instanceof DataView) {
    return new DataView(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
    ) as T;
  }
  return new (anyVal.constructor as any)(
    value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
  ) as T;
}

/******************************************************************************
                                  Functions
******************************************************************************/

export default copy;
