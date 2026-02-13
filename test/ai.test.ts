import { describe, expect, test, vi } from 'vitest';

import pojo, { type Dict, type OmitNever } from '../src';

describe('src/index.ts export contract', () => {
  test('should expose the documented default API surface', () => {
    expect(Object.keys(pojo)).toEqual([
      'omit',
      'pick',
      'merge',
      'fill',
      'append',
      'appendOne',
      'index',
      'remove',
      'toDict',
      'safeIndex',
      'reverseIndex',
      'safeReverseIndex',
      'is',
      'isKey',
      'isValue',
      'keys',
      'values',
      'entries',
      'firstEntry',
      'iterate',
      'copy',
      'compare',
    ]);
  });

  test('should keep remove() + OmitNever<T> aligned so removed keys can be stripped at type level', () => {
    const data = { id: 1, secret: 'x' };
    pojo.remove(data, 'secret');

    type PublicData = OmitNever<typeof data>;
    const publicData: PublicData = { id: data.id };

    expect(publicData).toEqual({ id: 1 });
  });
});

describe('pojo.is', () => {
  test('should return true for object literals', () => {
    expect(pojo.is({ a: 1 })).toBe(true);
  });

  test('should return true for Object.create(null) objects', () => {
    expect(pojo.is(Object.create(null))).toBe(true);
  });

  test('should return false for null and all primitives', () => {
    expect(pojo.is(null)).toBe(false);
    expect(pojo.is(undefined)).toBe(false);
    expect(pojo.is(1)).toBe(false);
    expect(pojo.is('x')).toBe(false);
    expect(pojo.is(false)).toBe(false);
    expect(pojo.is(1n)).toBe(false);
    expect(pojo.is(Symbol('s'))).toBe(false);
  });

  test('should return false for arrays and iterable objects', () => {
    expect(pojo.is([1, 2, 3])).toBe(false);
    const iterableLike = {
      [Symbol.iterator]: function* () {
        yield 1;
      },
    };
    expect(pojo.is(iterableLike)).toBe(false);
  });

  test('should return false for Date, Map, Set, RegExp, and class instances', () => {
    class User {}
    expect(pojo.is(new Date())).toBe(false);
    expect(pojo.is(new Map())).toBe(false);
    expect(pojo.is(new Set())).toBe(false);
    expect(pojo.is(/x/g)).toBe(false);
    expect(pojo.is(new User())).toBe(false);
  });

  test('should return false when Symbol.toStringTag exists', () => {
    const withTag = { [Symbol.toStringTag]: 'Tagged' };
    expect(pojo.is(withTag)).toBe(false);
  });
});

describe('pojo.toDict', () => {
  test('should return the same reference for plain objects', () => {
    const src = { a: 1 };
    const out = pojo.toDict(src);

    expect(out).toBe(src);
    const rec: Dict = out;
    expect(rec.a).toBe(1);
  });

  test('should accept null-prototype objects', () => {
    const src = Object.create(null) as Dict;
    src.a = 1;

    const out = pojo.toDict(src);
    expect(out).toBe(src);
    expect(Object.getPrototypeOf(out)).toBeNull();
  });

  test('should throw for non-plain inputs with expected message', () => {
    expect(() => pojo.toDict(new Date())).toThrowError(
      'value passed to ".toDict" not a plain-object',
    );
    expect(() => pojo.toDict([1, 2, 3] as unknown)).toThrowError(
      'value passed to ".toDict" not a plain-object',
    );
  });
});

describe('pojo.omit', () => {
  test('should omit a single key and return a new object', () => {
    const src = { id: 1, name: 'Ada' };
    const out = pojo.omit(src, 'id');

    expect(out).toEqual({ name: 'Ada' });
    expect(out).not.toBe(src);
  });

  test('should omit multiple keys', () => {
    const src = { id: 1, name: 'Ada', email: 'ada@example.com' };
    const out = pojo.omit(src, ['id', 'email']);

    expect(out).toEqual({ name: 'Ada' });
  });

  test('should ignore keys that are not present', () => {
    const src = { id: 1, name: 'Ada' };
    const out = pojo.omit(src as typeof src & { missing?: string }, 'missing');

    expect(out).toEqual(src);
  });

  test('should de-duplicate repeated keys', () => {
    const src = { a: 1, b: 2, c: 3 };
    const out = pojo.omit(src, ['a', 'a', 'c']);

    expect(out).toEqual({ b: 2 });
  });

  test('should include inherited enumerable keys because implementation uses for...in', () => {
    const proto = Object.create(null) as Record<string, unknown>;
    proto.inherited = 1;

    const src = Object.create(proto) as Record<string, unknown>;
    src.own = 2;

    const out = pojo.omit(src, 'own');
    expect(out).toEqual({ inherited: 1 });
  });

  test('should ignore symbol keys because for...in does not enumerate symbols', () => {
    const sym = Symbol('sym');
    const src = { a: 1, [sym]: 2 };

    const out = pojo.omit(src, 'a');

    expect(out).toEqual({});
    expect(Object.getOwnPropertySymbols(out)).toHaveLength(0);
  });

  test('should not mutate the original object', () => {
    const src = { a: 1, b: 2 };
    pojo.omit(src, 'a');
    expect(src).toEqual({ a: 1, b: 2 });
  });
});

describe('pojo.pick', () => {
  test('should pick a single key and return a new object', () => {
    const src = { id: 1, name: 'Ada' };
    const out = pojo.pick(src, 'id');

    expect(out).toEqual({ id: 1 });
    expect(out).not.toBe(src);
  });

  test('should pick multiple keys', () => {
    const src = { id: 1, name: 'Ada', email: 'ada@example.com' };
    const out = pojo.pick(src, ['id', 'email']);

    expect(out).toEqual({ id: 1, email: 'ada@example.com' });
  });

  test('should return empty object when no requested key exists', () => {
    const src = { id: 1 };
    const out = pojo.pick(src as typeof src & { missing?: number }, 'missing');

    expect(out).toEqual({});
  });

  test('should de-duplicate repeated keys', () => {
    const src = { a: 1, b: 2, c: 3 };
    const out = pojo.pick(src, ['a', 'a', 'c']);

    expect(out).toEqual({ a: 1, c: 3 });
  });

  test('should include inherited enumerable keys because implementation uses for...in', () => {
    const proto = Object.create(null) as Record<string, unknown>;
    proto.inherited = 1;

    const src = Object.create(proto) as Record<string, unknown>;
    src.own = 2;

    const out = pojo.pick(src, ['inherited'] as any);
    expect(out).toEqual({ inherited: 1 });
  });

  test('should ignore symbol keys because for...in does not enumerate symbols', () => {
    const sym = Symbol('sym');
    const src = { a: 1, [sym]: 2 };

    const out = pojo.pick(src, ['a', sym as never] as any);

    expect(out).toEqual({ a: 1 });
    expect(Object.getOwnPropertySymbols(out)).toHaveLength(0);
  });

  test('should not mutate the original object', () => {
    const src = { a: 1, b: 2 };
    pojo.pick(src, 'a');
    expect(src).toEqual({ a: 1, b: 2 });
  });
});

describe('pojo.merge', () => {
  test('should return a new object containing keys from both objects', () => {
    const a = { id: 1 };
    const b = { name: 'Ada' };
    const out = pojo.merge(a, b);

    expect(out).toEqual({ id: 1, name: 'Ada' });
    expect(out).not.toBe(a);
    expect(out).not.toBe(b);
  });

  test('should let right-hand keys overwrite collisions', () => {
    const out = pojo.merge({ a: 1, b: 2 }, { b: 9, c: 3 });
    expect(out).toEqual({ a: 1, b: 9, c: 3 });
  });

  test('should be shallow for nested objects', () => {
    const nested = { x: 1 };
    const out = pojo.merge({ a: nested }, {});

    expect(out.a).toBe(nested);
  });

  test('should not mutate either input object', () => {
    const a = { a: 1 };
    const b = { b: 2 };
    pojo.merge(a, b);

    expect(a).toEqual({ a: 1 });
    expect(b).toEqual({ b: 2 });
  });

  test('should keep enumerable symbol keys via object spread semantics', () => {
    const sym = Symbol('sym');
    const out = pojo.merge({}, { [sym]: 123 });

    expect((out as any)[sym]).toBe(123);
  });
});

describe('pojo.fill', () => {
  test('should use defaults when partial is undefined', () => {
    expect(pojo.fill({ a: 1 }, undefined)).toEqual({ a: 1 });
  });

  test('should use defaults when partial is null', () => {
    expect(pojo.fill({ a: 1 }, {})).toEqual({ a: 1 });
  });

  test('should apply partial overrides', () => {
    expect(pojo.fill({ a: 1, b: 2 }, { b: 9 })).toEqual({ a: 1, b: 9 });
  });

  test('should allow explicit undefined in partial to overwrite defaults', () => {
    expect(pojo.fill({ a: 1 }, { a: undefined })).toEqual({ a: undefined });
  });

  test('should remain shallow for nested objects', () => {
    const nested = { x: 1 };
    const out = pojo.fill({ nested }, {});

    expect(out.nested).toBe(nested);
  });

  test('should not mutate defaults object', () => {
    const defaults = { a: 1, b: 2 };
    pojo.fill(defaults, { a: 9 });
    expect(defaults).toEqual({ a: 1, b: 2 });
  });
});

describe('pojo.append', () => {
  test('should mutate target object in place', () => {
    const target = { a: 1 };
    const ref = target;

    pojo.append(target, { b: 2 });

    expect(target).toEqual({ a: 1, b: 2 });
    expect(target).toBe(ref);
  });

  test('should overwrite existing keys on collisions', () => {
    const target = { a: 1, b: 2 };
    pojo.append(target, { b: 9 });
    expect(target).toEqual({ a: 1, b: 9 });
  });

  test('should copy inherited enumerable keys from addOn', () => {
    const proto = Object.create(null) as Record<string, unknown>;
    proto.inherited = 1;

    const addOn = Object.create(proto) as Record<string, unknown>;
    addOn.own = 2;

    const target: Record<string, unknown> = {};
    pojo.append(target, addOn);

    expect(target).toEqual({ own: 2, inherited: 1 });
  });

  test('should ignore symbol keys from addOn', () => {
    const sym = Symbol('sym');
    const target: Record<string, unknown> = {};
    const addOn = { a: 1, [sym]: 2 };

    pojo.append(target, addOn as any);

    expect(target).toEqual({ a: 1 });
    expect((target as any)[sym]).toBeUndefined();
  });

  test('should define __proto__ behavior explicitly', () => {
    const target: Record<string, unknown> = {};
    const addOn = Object.create(null) as Record<string, unknown>;
    addOn.__proto__ = { polluted: true };

    pojo.append(target, addOn);

    expect((target as any).polluted).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(target, '__proto__')).toBe(
      false,
    );
  });
});

describe('pojo.appendOne', () => {
  test('should mutate target object by adding one entry', () => {
    const target = { a: 1 };
    const ref = target;

    pojo.appendOne(target, ['b', 2]);

    expect(target).toEqual({ a: 1, b: 2 });
    expect(target).toBe(ref);
  });

  test('should overwrite existing keys', () => {
    const target = { a: 1 };
    pojo.appendOne(target, ['a', 9]);

    expect(target).toEqual({ a: 9 });
  });

  test('should define __proto__ behavior explicitly', () => {
    const target: Record<string, unknown> = {};

    pojo.appendOne(target, ['__proto__', { hacked: 1 }] as any);

    expect((target as any).hacked).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(target, '__proto__')).toBe(
      false,
    );
  });
});

describe('pojo.remove', () => {
  test('should delete a single key in place', () => {
    const target = { a: 1, b: 2 };
    const ref = target;

    pojo.remove(target, 'b');

    expect(target).toEqual({ a: 1 });
    expect(target).toBe(ref);
  });

  test('should delete multiple keys and tolerate duplicates', () => {
    const target = { a: 1, b: 2, c: 3 };

    pojo.remove(target, ['a', 'a', 'c']);

    expect(target).toEqual({ b: 2 });
  });

  test('should no-op when keys are missing', () => {
    const target = { a: 1 };

    pojo.remove(target as typeof target & { missing?: number }, 'missing');

    expect(target).toEqual({ a: 1 });
  });

  test('should reveal inherited property after deleting own shadowing property', () => {
    const proto = { a: 1 };
    const target = Object.create(proto) as { a: number };
    target.a = 9;

    pojo.remove(target, 'a');

    expect(target.a).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(target, 'a')).toBe(false);
  });
});

describe('pojo.index', () => {
  test('should return existing own value', () => {
    expect(pojo.index({ a: 1 }, 'a')).toBe(1);
  });

  test('should return inherited values when key exists on prototype chain', () => {
    const proto = { a: 1 };
    const obj = Object.create(proto) as { a: number };

    expect(pojo.index(obj, 'a')).toBe(1);
  });

  test('should return undefined for missing key', () => {
    expect(pojo.index({ a: 1 }, 'missing')).toBeUndefined();
  });

  test('should support numeric key input', () => {
    const obj = { 1: 'one' };
    expect(pojo.index(obj, 1)).toBe('one');
  });
});

describe('pojo.safeIndex', () => {
  test('should return existing own value', () => {
    expect(pojo.safeIndex({ a: 1 }, 'a')).toBe(1);
  });

  test('should return inherited values when key exists on prototype chain', () => {
    const proto = { a: 1 };
    const obj = Object.create(proto) as { a: number };

    expect(pojo.safeIndex(obj, 'a')).toBe(1);
  });

  test('should throw for missing key and include key in message', () => {
    expect(() => pojo.safeIndex({ a: 1 }, 'missing')).toThrowError(
      'safeIndex was passed a key not present on the object. key: missing',
    );
  });
});

describe('pojo.reverseIndex', () => {
  test('should return all matching keys', () => {
    expect(pojo.reverseIndex({ a: 1, b: 2, c: 1 }, 1)).toEqual(['a', 'c']);
  });

  test('should return empty array when there is no match', () => {
    expect(pojo.reverseIndex({ a: 1 }, 9)).toEqual([]);
  });

  test('should use strict equality (===) and not coerce', () => {
    expect(pojo.reverseIndex({ a: 1, b: '1' }, '1')).toEqual(['b']);
  });

  test('should not treat NaN as equal to NaN because strict equality is used', () => {
    expect(pojo.reverseIndex({ a: Number.NaN }, Number.NaN)).toEqual([]);
  });

  test('should include inherited enumerable keys because implementation uses for...in', () => {
    const proto = Object.create(null) as Record<string, unknown>;
    proto.inherited = 1;

    const obj = Object.create(proto) as Record<string, unknown>;
    obj.own = 1;

    expect(pojo.reverseIndex(obj, 1)).toEqual(['own', 'inherited']);
  });
});

describe('pojo.safeReverseIndex', () => {
  test('should return key when exactly one match exists', () => {
    expect(pojo.safeReverseIndex({ a: 1, b: 2 }, 2)).toBe('b');
  });

  test('should throw when no key matches', () => {
    expect(() => pojo.safeReverseIndex({ a: 1 }, 9)).toThrowError(
      '.safeReverseIndex found 0 or more than 1 keys for value: 9',
    );
  });

  test('should throw when multiple keys match', () => {
    expect(() => pojo.safeReverseIndex({ a: 1, b: 1 }, 1)).toThrowError(
      '.safeReverseIndex found 0 or more than 1 keys for value: 1',
    );
  });

  test('should include inherited enumerable keys when determining uniqueness', () => {
    const proto = Object.create(null) as Record<string, unknown>;
    proto.inherited = 1;

    const obj = Object.create(proto) as Record<string, unknown>;
    obj.own = 2;

    expect(pojo.safeReverseIndex(obj, 1)).toBe('inherited');
  });
});

describe('pojo.isKey', () => {
  test('should return true for existing own string key', () => {
    expect(pojo.isKey({ a: 1 }, 'a')).toBe(true);
  });

  test('should return true for inherited string key because it uses "in"', () => {
    const proto = { a: 1 };
    const obj = Object.create(proto) as { a: number };

    expect(pojo.isKey(obj, 'a')).toBe(true);
  });

  test('should return false for missing key', () => {
    expect(pojo.isKey({ a: 1 }, 'missing')).toBe(false);
  });

  test('should return false for symbol keys even when present', () => {
    const sym = Symbol('sym');
    const obj = { [sym]: 1 };

    expect(pojo.isKey(obj as any, sym)).toBe(false);
  });

  test('should return false for numeric PropertyKey input', () => {
    expect(pojo.isKey({ 1: 'one' }, 1)).toBe(false);
  });

  test('should return false when an array is passed at runtime', () => {
    expect(pojo.isKey({ a: 1 } as any, ['a'] as any)).toBe(false);
  });
});

describe('pojo.isValue', () => {
  test('should return true when value exists in the object', () => {
    expect(pojo.isValue({ a: 1, b: 2 }, 2)).toBe(true);
  });

  test('should return false when value does not exist', () => {
    expect(pojo.isValue({ a: 1, b: 2 }, 9)).toBe(false);
  });

  test('should support array input and require every candidate value to exist', () => {
    expect(pojo.isValue({ a: 1, b: 2, c: 3 }, [1, 3] as any)).toBe(true);
    expect(pojo.isValue({ a: 1, b: 2, c: 3 }, [1, 4] as any)).toBe(false);
  });

  test('should treat NaN as present when object values include NaN (Set semantics)', () => {
    expect(pojo.isValue({ a: Number.NaN }, Number.NaN)).toBe(true);
  });

  test('should compare objects by reference identity, not deep equality', () => {
    const ref = { x: 1 };
    expect(pojo.isValue({ a: ref }, { x: 1 })).toBe(false);
    expect(pojo.isValue({ a: ref }, ref)).toBe(true);
  });
});

describe('pojo.keys', () => {
  test('should return own enumerable string keys only', () => {
    expect(pojo.keys({ a: 1, b: 2 })).toEqual(['a', 'b']);
  });

  test('should not include inherited or symbol keys', () => {
    const sym = Symbol('sym');
    const proto = { inherited: 1 };
    const obj = Object.create(proto) as Record<string | symbol, unknown>;
    obj.a = 1;
    obj[sym] = 2;

    expect(pojo.keys(obj)).toEqual(['a']);
  });

  test('should follow JavaScript key ordering rules', () => {
    const obj = { b: 2, 1: 1, a: 3 };
    expect(pojo.keys(obj)).toEqual(['1', 'b', 'a']);
  });

  test('should return [] for empty objects', () => {
    expect(pojo.keys({})).toEqual([]);
  });
});

describe('pojo.values', () => {
  test('should return own enumerable string-keyed values only', () => {
    expect(pojo.values({ a: 1, b: 2 })).toEqual([1, 2]);
  });

  test('should not include inherited or symbol-keyed values', () => {
    const sym = Symbol('sym');
    const proto = { inherited: 1 };
    const obj = Object.create(proto) as Record<string | symbol, unknown>;
    obj.a = 2;
    obj[sym] = 3;

    expect(pojo.values(obj)).toEqual([2]);
  });

  test('should follow same ordering as keys', () => {
    const obj = { b: 2, 1: 1, a: 3 };
    expect(pojo.values(obj)).toEqual([1, 2, 3]);
  });

  test('should return [] for empty objects', () => {
    expect(pojo.values({})).toEqual([]);
  });
});

describe('pojo.entries', () => {
  test('should return own enumerable string-keyed entries only', () => {
    expect(pojo.entries({ a: 1, b: 2 })).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  test('should not include inherited or symbol-keyed entries', () => {
    const sym = Symbol('sym');
    const proto = { inherited: 1 };
    const obj = Object.create(proto) as Record<string | symbol, unknown>;
    obj.a = 2;
    obj[sym] = 3;

    expect(pojo.entries(obj)).toEqual([['a', 2]]);
  });

  test('should follow JavaScript entry ordering rules', () => {
    const obj = { b: 2, 1: 1, a: 3 };
    expect(pojo.entries(obj)).toEqual([
      ['1', 1],
      ['b', 2],
      ['a', 3],
    ]);
  });

  test('should return [] for empty objects', () => {
    expect(pojo.entries({})).toEqual([]);
  });
});

describe('pojo.firstEntry', () => {
  test('should return first entry according to JavaScript enumeration order', () => {
    expect(pojo.firstEntry({ id: 1, name: 'Ada' })).toEqual(['id', 1]);
  });

  test('should prioritize integer-like keys before insertion-order string keys', () => {
    expect(pojo.firstEntry({ b: 2, 1: 1, a: 3 })).toEqual(['1', 1]);
  });

  test('should return undefined at runtime for empty object', () => {
    expect(pojo.firstEntry({} as any)).toBeUndefined();
  });

  test('should ignore symbol keys', () => {
    const sym = Symbol('sym');
    const obj = { [sym]: 2, a: 1 };
    expect(pojo.firstEntry(obj)).toEqual(['a', 1]);
  });
});

describe('pojo.iterate', () => {
  test('should no-op when root is not a plain-object', () => {
    class User {}
    const cb = vi.fn();

    pojo.iterate(null, cb);
    pojo.iterate(1, cb);
    pojo.iterate('x', cb);
    pojo.iterate([1, 2], cb);
    pojo.iterate(new Date(), cb);
    pojo.iterate(new User(), cb);

    expect(cb).not.toHaveBeenCalled();
  });

  test('should recurse into nested plain objects', () => {
    const seen: Array<{
      path: readonly (string | number)[];
      key: string | number;
      value: unknown;
    }> = [];

    pojo.iterate({ a: { b: 1, c: { d: 2 } } }, ({ path, key, value }) => {
      seen.push({ path: [...path], key, value });
    });

    expect(seen).toEqual([
      { path: ['a'], key: 'b', value: 1 },
      { path: ['a', 'c'], key: 'd', value: 2 },
    ]);
  });

  test('should recurse into arrays nested inside plain objects', () => {
    const seen: Array<{
      path: readonly (string | number)[];
      key: string | number;
      value: unknown;
    }> = [];

    pojo.iterate({ arr: [1, { x: 2 }] }, ({ path, key, value }) => {
      seen.push({ path: [...path], key, value });
    });

    expect(seen).toEqual([
      { path: ['arr'], key: 0, value: 1 },
      { path: ['arr', 1, 1], key: 'x', value: 2 },
    ]);
  });

  test('should recurse into nested Object.create(null) objects', () => {
    const bare = Object.create(null) as Record<string, unknown>;
    bare.leaf = 42;

    const cb = vi.fn();
    pojo.iterate({ bare }, cb);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({
      parent: bare,
      key: 'leaf',
      value: 42,
      path: ['bare'],
    });
  });

  test('should treat Map/Set/Date/RegExp as leaf values', () => {
    const map = new Map([['k', 1]]);
    const set = new Set([1]);
    const date = new Date('2024-01-01T00:00:00.000Z');
    const reg = /x/g;

    const keys: Array<string | number> = [];
    pojo.iterate({ map, set, date, reg }, ({ key }) => keys.push(key));

    expect(keys).toEqual(['map', 'set', 'date', 'reg']);
  });

  test('should provide path to parent node for object-only nesting', () => {
    const seen: Array<{
      path: readonly (string | number)[];
      key: string | number;
    }> = [];

    pojo.iterate({ a: { b: { c: 1 } } }, ({ path, key }) => {
      seen.push({ path: [...path], key });
    });

    expect(seen).toEqual([{ path: ['a', 'b'], key: 'c' }]);
  });

  test('should pass the actual parent reference to callback', () => {
    const root = { a: { b: 1 } };
    let parentRef: unknown;

    pojo.iterate(root, ({ parent, key }) => {
      if (key === 'b') parentRef = parent;
    });

    expect(parentRef).toBe(root.a);
  });

  test('should ignore non-enumerable and symbol keys', () => {
    const sym = Symbol('sym');
    const root: Record<string | symbol, unknown> = { visible: 1, [sym]: 2 };
    Object.defineProperty(root, 'hidden', { value: 3, enumerable: false });

    const keys: Array<string | number> = [];
    pojo.iterate(root, ({ key }) => keys.push(key));

    expect(keys).toEqual(['visible']);
  });

  test('should emit zero callbacks for empty root object', () => {
    const cb = vi.fn();
    pojo.iterate({}, cb);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('pojo.copy', () => {
  test('should deep-copy plain-object and array branches', () => {
    const src = {
      a: { b: 1 },
      arr: [{ c: 2 }, [3]],
    };

    const out = pojo.copy(src);

    expect(out).toEqual(src);
    expect(out).not.toBe(src);
    expect(out.a).not.toBe(src.a);
    expect(out.arr).not.toBe(src.arr);
    expect(out.arr[0]).not.toBe(src.arr[0]);
    expect(out.arr[1]).not.toBe(src.arr[1]);
  });

  test('should preserve null prototype for root null-prototype objects', () => {
    const src = Object.create(null) as Record<string, unknown>;
    src.nested = { x: 1 };

    const out = pojo.copy(src);

    expect(Object.getPrototypeOf(out)).toBeNull();
    expect(out).not.toBe(src);
    expect(out.nested as object).not.toBe(src.nested);
  });

  test('should copy nested Date values by epoch', () => {
    const src = { date: new Date('2024-01-01T00:00:00.000Z') };
    const out = pojo.copy(src);

    expect(out.date).not.toBe(src.date);
    expect(out.date.getTime()).toBe(src.date.getTime());
  });

  test('should shallow-clone nested Map and Set values', () => {
    const keyRef = { id: 1 };
    const valueRef = { name: 'Ada' };
    const memberRef = { role: 'admin' };

    const src = {
      map: new Map([[keyRef, valueRef]]),
      set: new Set([memberRef]),
    };
    const out = pojo.copy(src);

    expect(out.map).not.toBe(src.map);
    expect(out.set).not.toBe(src.set);
    expect([...out.map.keys()][0]).toBe(keyRef);
    expect([...out.map.values()][0]).toBe(valueRef);
    expect([...out.set][0]).toBe(memberRef);
  });

  test('should clone nested RegExp and preserve source/flags/lastIndex', () => {
    const re = /ab/gi;
    re.lastIndex = 2;

    const src = { re };
    const out = pojo.copy(src);

    expect(out.re).not.toBe(re);
    expect(out.re.source).toBe('ab');
    expect(out.re.flags).toBe('gi');
    expect(out.re.lastIndex).toBe(2);
  });

  test('should clone nested typed arrays with independent buffers', () => {
    const src = { typed: new Uint8Array([1, 2, 3]) };
    const out = pojo.copy(src);

    out.typed[0] = 9;

    expect(out.typed).not.toBe(src.typed);
    expect(src.typed[0]).toBe(1);
    expect(out.typed[0]).toBe(9);
  });

  test('should clone nested DataView with independent underlying buffer', () => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint8(0, 10);

    const src = { view };
    const out = pojo.copy(src);

    out.view.setUint8(0, 77);

    expect(out.view).not.toBe(view);
    expect(view.getUint8(0)).toBe(10);
    expect(out.view.getUint8(0)).toBe(77);
  });

  test('should shallow-clone nested class instances and preserve prototype', () => {
    class User {
      constructor(
        public name: string,
        public meta: { level: number },
      ) {}
    }
    const user = new User('Ada', { level: 1 });

    const src = { user };
    const out = pojo.copy(src);

    expect(out.user).not.toBe(user);
    expect(out.user instanceof User).toBe(true);
    expect(Object.getPrototypeOf(out.user)).toBe(User.prototype);
    expect(out.user.meta).toBe(user.meta);
  });

  test('should keep nested function references unchanged', () => {
    const fn = () => 'hello';
    const src = { fn, arr: [fn] };

    const out = pojo.copy(src);

    expect(out.fn).toBe(fn);
    expect(out.arr[0]).toBe(fn);
  });

  test('should ignore symbol and non-enumerable keys on plain-object branches', () => {
    const sym = Symbol('sym');
    const src = { visible: 1, [sym]: 2 } as Record<string | symbol, unknown>;
    Object.defineProperty(src, 'hidden', { value: 3, enumerable: false });

    const out = pojo.copy(src as Record<string, unknown>);

    expect(out).toEqual({ visible: 1 });
    expect(Object.getOwnPropertySymbols(out)).toHaveLength(0);
    expect((out as any).hidden).toBeUndefined();
  });

  test('should throw for non-plain root values', () => {
    class User {}

    expect(() => pojo.copy([1, 2] as unknown as object)).toThrowError(
      'copy only accepts a plain-object as the root value',
    );
    expect(() => pojo.copy(new Date() as unknown as object)).toThrowError(
      'copy only accepts a plain-object as the root value',
    );
    expect(() => pojo.copy(new User() as unknown as object)).toThrowError(
      'copy only accepts a plain-object as the root value',
    );
  });

  test('should throw for circular references (not supported)', () => {
    const src: Record<string, unknown> = {};
    src.self = src;

    expect(() => pojo.copy(src)).toThrow();
  });
});

describe('pojo.compare', () => {
  test('should return false if either root is not a plain-object', () => {
    expect(pojo.compare(null as any, {} as any)).toBe(false);
    expect(pojo.compare({} as any, null as any)).toBe(false);
    expect(pojo.compare([1] as any, [1] as any)).toBe(false);
    expect(pojo.compare(new Date() as any, new Date() as any)).toBe(false);
  });

  test('should compare nested plain-objects deeply', () => {
    expect(pojo.compare({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    expect(pojo.compare({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
  });

  test('should recurse through arrays', () => {
    expect(pojo.compare({ arr: [1, { x: 2 }] }, { arr: [1, { x: 2 }] })).toBe(
      true,
    );
    expect(pojo.compare({ arr: [1, { x: 2 }] }, { arr: [1, { x: 3 }] })).toBe(
      false,
    );
  });

  test('should compare Date values by epoch', () => {
    const a = { d: new Date('2024-01-01T00:00:00.000Z') };
    const b = { d: new Date('2024-01-01T00:00:00.000Z') };
    const c = { d: new Date('2024-01-02T00:00:00.000Z') };

    expect(pojo.compare(a, b)).toBe(true);
    expect(pojo.compare(a, c)).toBe(false);
  });

  test('should compare nested non-plain objects by reference', () => {
    const shared = new Set([1]);

    expect(pojo.compare({ s: shared }, { s: shared })).toBe(true);
    expect(pojo.compare({ s: new Set([1]) }, { s: new Set([1]) })).toBe(false);
  });

  test('should return false for key-count mismatch and missing keys', () => {
    expect(pojo.compare({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(pojo.compare({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false);
  });

  test('should use Object.is semantics for primitives', () => {
    expect(pojo.compare({ n: Number.NaN }, { n: Number.NaN })).toBe(true);
    expect(pojo.compare({ n: +0 }, { n: -0 })).toBe(false);
  });

  test('should ignore symbol keys because Object.keys is used', () => {
    const sym = Symbol('sym');
    const a = { x: 1, [sym]: 1 };
    const b = { x: 1, [sym]: 2 };

    expect(pojo.compare(a, b)).toBe(true);
  });

  test('should ignore non-enumerable keys because Object.keys is used', () => {
    const a = { x: 1 } as Record<string, unknown>;
    const b = { x: 1 } as Record<string, unknown>;

    Object.defineProperty(a, 'hidden', { value: 1, enumerable: false });
    Object.defineProperty(b, 'hidden', { value: 2, enumerable: false });

    expect(pojo.compare(a, b)).toBe(true);
  });

  test('should ignore inherited keys because Object.keys only checks own keys', () => {
    const protoA = Object.create(null) as Record<string, unknown>;
    protoA.inherited = 1;
    const a = Object.create(protoA) as Record<string, unknown>;
    a.own = 1;

    const protoB = Object.create(null) as Record<string, unknown>;
    protoB.inherited = 999;
    const b = Object.create(protoB) as Record<string, unknown>;
    b.own = 1;

    expect(pojo.compare(a, b)).toBe(true);
  });
});
