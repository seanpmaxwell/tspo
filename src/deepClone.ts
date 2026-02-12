import { Mutable } from './utility-types.js';

type PlainObject = Record<string, any>;
const hop = Object.prototype.hasOwnProperty;

function deepClone<T>(value: T): Mutable<T> {
  if (value === null || typeof value !== 'object') return value;
  // Array fast path
  if (Array.isArray(value)) return cloneArray(value) as T;
  // Plain object fast path (including null-prototype)
  const proto = Object.getPrototypeOf(value);
  if (proto === Object.prototype || proto === null) {
    return clonePlainObject(value as PlainObject, proto) as T;
  }
  // Everything else
  return cloneExotic(value);
}

function cloneArray(source: readonly unknown[]): unknown[] {
  const len = source.length;
  const out = new Array(len);
  for (let i = 0; i < len; i++) out[i] = deepClone(source[i]);
  return out;
}

function clonePlainObject(
  source: PlainObject,
  proto: object | null,
): PlainObject {
  // Preserve null-prototype (and avoid shape transitions from changing proto later)
  const out: PlainObject = proto === null ? Object.create(null) : {};
  // Avoid allocating keys array
  for (const key in source) {
    if (hop.call(source, key)) {
      out[key] = deepClone(source[key]);
    }
  }
  return out;
}

function cloneExotic<T>(value: T): T {
  // Order matters: hit common cases early
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (value instanceof RegExp) {
    const re = new RegExp(value.source, value.flags);
    re.lastIndex = value.lastIndex; // preserve state (often missed)
    return re as T;
  }
  if (value instanceof Map) {
    const out = new Map<any, any>();
    value.forEach((v, k) => {
      out.set(deepClone(k), deepClone(v));
    });
    return out as T;
  }
  if (value instanceof Set) {
    const out = new Set<any>();
    value.forEach((v) => out.add(deepClone(v)));
    return out as T;
  }
  // Typed arrays / DataView
  if (ArrayBuffer.isView(value)) {
    // TypedArray.prototype.slice exists; DataView doesn't.
    // If slice exists, it's usually the fastest.
    const anyVal: any = value as any;
    if (typeof anyVal.slice === 'function') {
      return anyVal.slice() as T;
    }
    if (value instanceof DataView) {
      return new DataView(
        value.buffer.slice(
          value.byteOffset,
          value.byteOffset + value.byteLength,
        ),
      ) as T;
    }
    // Fallback: clone underlying bytes for other views
    return new (anyVal.constructor as any)(
      value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength),
    );
  }
  if (value instanceof ArrayBuffer) return value.slice(0) as T;
  // Generic object: preserve prototype, copy only enumerable own props
  const proto = Object.getPrototypeOf(value);
  const out: any = Object.create(proto);
  // Avoid allocating keys array
  for (const key in value as any) {
    if (hop.call(value, key)) {
      out[key] = deepClone((value as any)[key]);
    }
  }
  return out as T;
}

export default deepClone;
