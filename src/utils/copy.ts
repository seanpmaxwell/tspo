import isPlainObject, {
  type Dict,
  type PlainObject,
} from '../isPlainObject.js';
import { type Mutable } from '../utility-types.js';

const hop = Object.prototype.hasOwnProperty;

/**
 * Deep clones ONLY plain-objects (incl. null-prototype).
 *
 * - Root value must be a plain-object.
 * - Recursion descends only into plain-objects and arrays.
 * - Nested Date values are copied by epoch.
 * - Other nested non-plain objects are shallow-cloned.
 */
function copy<T extends PlainObject>(value: T): Mutable<T> {
  if (!isPlainObject(value)) {
    throw new TypeError('copy only accepts a plain-object as the root value');
  }
  return clonePlainObject(
    value as Dict,
    Object.getPrototypeOf(value),
  ) as Mutable<T>;
}

function clonePlainObject(source: object, proto: object | null): Dict {
  const out: Dict = proto === null ? Object.create(null) : {};
  for (const key in source) {
    if (!hop.call(source, key)) continue;
    out[key] = cloneValue((source as Dict)[key]);
  }
  return out;
}

function cloneValue(value: unknown): unknown {
  if (isPlainObject(value)) {
    return clonePlainObject(value as Dict, Object.getPrototypeOf(value));
  }
  if (Array.isArray(value)) {
    return cloneArray(value);
  }
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (typeof value === 'object' && value !== null) {
    return cloneNonPlainShallow(value);
  }
  return value;
}

function cloneArray(source: readonly unknown[]): unknown[] {
  const len = source.length;
  const out = new Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = cloneValue(source[i]);
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

export default copy;
