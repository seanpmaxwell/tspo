import { Mutable } from './utility-types.js';

type Dict = Record<string, any>;
const hop = Object.prototype.hasOwnProperty;

function isPlainOrBareObj(value: unknown): value is Dict {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Deep clones ONLY plain objects (incl. null-prototype).
 * Arrays are shallow-copied, BUT any array element that is a plain object is deep-cloned.
 * Everything else is shallow-cloned.
 */
function deepClone<T>(value: T): Mutable<T> {
  if (value === null || typeof value !== 'object') return value as Mutable<T>;
  // Arrays: shallow copy, deep-clone plain-object elements
  if (Array.isArray(value)) return cloneArray(value) as unknown as Mutable<T>;
  // Plain objects: deep
  if (isPlainOrBareObj(value)) {
    return clonePlainObject(
      value as Dict,
      Object.getPrototypeOf(value),
    ) as Mutable<T>;
  }
  // Everything else: shallow
  return cloneNonPlainShallow(value) as Mutable<T>;
}

function cloneArray(source: readonly unknown[]): unknown[] {
  const len = source.length;
  const out = new Array(len);
  for (let i = 0; i < len; i++) {
    const v = source[i];
    out[i] = isPlainOrBareObj(v)
      ? clonePlainObject(v, Object.getPrototypeOf(v))
      : v;
  }
  return out;
}

function clonePlainObject(source: Dict, proto: object | null): Dict {
  const out: Dict = proto === null ? Object.create(null) : {};
  for (const key in source) {
    if (!hop.call(source, key)) continue;
    const v = source[key];
    // Only recurse into plain objects; everything else is copied by reference.
    out[key] = isPlainOrBareObj(v)
      ? clonePlainObject(v, Object.getPrototypeOf(v))
      : v;
  }
  return out;
}

function cloneNonPlainShallow<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as T;
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

export default deepClone;
