import isPlainObject, {
  type Dict,
  type PlainObject,
} from '../isPlainObject.js';

const hop = Object.prototype.hasOwnProperty;

type CopyOptions = {
  resetDates?: boolean;
  deepCloneAll?: boolean;
};

type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

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
function copy<T extends PlainObject>(
  value: T,
  options?: CopyOptions,
): Mutable<T> {
  if (!isPlainObject(value)) {
    throw new TypeError('copy only accepts a plain-object as the root value');
  }
  const resetDates = options?.resetDates === true;
  const deepCloneAll = options?.deepCloneAll === true;
  return clonePlainObject(
    value as Dict,
    Object.getPrototypeOf(value),
    resetDates,
    deepCloneAll,
  ) as Mutable<T>;
}

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

function cloneArray(
  source: readonly unknown[],
  resetDates: boolean,
  deepCloneAll: boolean,
): unknown[] {
  const len = source.length;
  const out = new Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = cloneValue(source[i], resetDates, deepCloneAll);
  }
  return out;
}

function cloneNonPlainShallow<T>(value: T): T {
  if (value instanceof RegExp) {
    const re = new RegExp(value.source, value.flags);
    re.lastIndex = value.lastIndex;
    return re as T;
  }
  if (value instanceof Map) return new Map(value as any) as T;
  if (value instanceof Set) return new Set(value as any) as T;
  if (ArrayBuffer.isView(value)) {
    const anyVal: any = value as any;
    if (typeof anyVal.slice === 'function') return anyVal.slice() as T;
    if (value instanceof DataView) {
      return new DataView(
        value.buffer.slice(
          value.byteOffset,
          value.byteOffset + value.byteLength,
        ),
      ) as T;
    }
    return new (anyVal.constructor as any)(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
    );
  }
  if (value instanceof ArrayBuffer) return value.slice(0) as T;
  // Generic non-plain object: shallow clone own enumerable props (values as-is)
  const proto = Object.getPrototypeOf(value);
  const out: any = Object.create(proto);
  for (const key in value as any) {
    if (hop.call(value, key)) out[key] = (value as any)[key];
  }
  return out as T;
}

/**
 *
 */
function cloneNonPlainDeep<T>(value: T, resetDates: boolean): T {
  if (value instanceof RegExp) {
    const re = new RegExp(value.source, value.flags);
    re.lastIndex = value.lastIndex;
    return re as T;
  }
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
  if (value instanceof Set) {
    const out = new Set();
    for (const entry of value) {
      out.add(cloneValue(entry, resetDates, true));
    }
    return out as T;
  }
  if (ArrayBuffer.isView(value)) {
    const anyVal: any = value as any;
    if (typeof anyVal.slice === 'function') return anyVal.slice() as T;
    if (value instanceof DataView) {
      return new DataView(
        value.buffer.slice(
          value.byteOffset,
          value.byteOffset + value.byteLength,
        ),
      ) as T;
    }
    return new (anyVal.constructor as any)(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
    );
  }
  if (value instanceof ArrayBuffer) return value.slice(0) as T;
  const proto = Object.getPrototypeOf(value);
  const out: any = Object.create(proto);
  for (const key in value as any) {
    if (!hop.call(value, key)) continue;
    out[key] = cloneValue((value as any)[key], resetDates, true);
  }
  return out as T;
}

export default copy;
