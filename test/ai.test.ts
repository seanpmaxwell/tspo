import { describe, expect, test, vi } from 'vitest';

import tspo, { type OmitNever } from '../src';

describe('src/index.ts export contract', () => {
  test('should expose the documented default API surface', () => {
    expect(Object.keys(tspo)).toEqual([
      'omit',
      'pick',
      'merge',
      'mergeArray',
      'append',
      'addEntry',
      'addEntries',
      'index',
      'remove',
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
      'isDict',
    ]);
  });

  test('should keep remove() + OmitNever<T> aligned so removed keys can be stripped at type level', () => {
    const data = { id: 1, secret: 'x' };
    tspo.remove(data, 'secret');

    type PublicData = OmitNever<typeof data>;
    const publicData: PublicData = { id: data.id };

    expect(publicData).toEqual({ id: 1 });
  });
});

describe('tspo.is', () => {
  test('should return true for object literals', () => {
    expect(tspo.is({ a: 1 })).toBe(true);
  });

  test('should return true for Object.create(null) objects', () => {
    expect(tspo.is(Object.create(null))).toBe(true);
  });

  test('should return false for null and all primitives', () => {
    expect(tspo.is(null)).toBe(false);
    expect(tspo.is(undefined)).toBe(false);
    expect(tspo.is(1)).toBe(false);
    expect(tspo.is('x')).toBe(false);
    expect(tspo.is(false)).toBe(false);
    expect(tspo.is(1n)).toBe(false);
    expect(tspo.is(Symbol('s'))).toBe(false);
  });

  test('should return false for arrays and iterable objects', () => {
    expect(tspo.is([1, 2, 3])).toBe(false);
    const iterableLike = {
      [Symbol.iterator]: function* () {
        yield 1;
      },
    };
    expect(tspo.is(iterableLike)).toBe(false);
  });

  test('should return false for Date, Map, Set, RegExp, and class instances', () => {
    class User {}
    expect(tspo.is(new Date())).toBe(false);
    expect(tspo.is(new Map())).toBe(false);
    expect(tspo.is(new Set())).toBe(false);
    expect(tspo.is(/x/g)).toBe(false);
    expect(tspo.is(new User())).toBe(false);
  });

  test('should return false when Symbol.toStringTag exists', () => {
    const withTag = { [Symbol.toStringTag]: 'Tagged' };
    expect(tspo.is(withTag)).toBe(false);
  });
});

describe('tspo.omit', () => {
  test('should omit a single key and return a new object', () => {
    const src = { id: 1, name: 'Ada' };
    const out = tspo.omit(src, 'id');

    expect(out).toEqual({ name: 'Ada' });
    expect(out).not.toBe(src);
  });

  test('should omit multiple keys', () => {
    const src = { id: 1, name: 'Ada', email: 'ada@example.com' };
    const out = tspo.omit(src, ['id', 'email']);

    expect(out).toEqual({ name: 'Ada' });
  });

  test('should ignore keys that are not present', () => {
    const src = { id: 1, name: 'Ada' };
    const out = tspo.omit(src as typeof src & { missing?: string }, 'missing');

    expect(out).toEqual(src);
  });

  test('should de-duplicate repeated keys', () => {
    const src = { a: 1, b: 2, c: 3 };
    const out = tspo.omit(src, ['a', 'a', 'c']);

    expect(out).toEqual({ b: 2 });
  });

  test('should include inherited enumerable keys because implementation uses for...in', () => {
    const proto = Object.create(null) as Record<string, unknown>;
    proto.inherited = 1;

    const src = Object.create(proto) as Record<string, unknown>;
    src.own = 2;

    const out = tspo.omit(src, 'own');
    expect(out).toEqual({ inherited: 1 });
  });

  test('should ignore symbol keys because for...in does not enumerate symbols', () => {
    const sym = Symbol('sym');
    const src = { a: 1, [sym]: 2 };

    const out = tspo.omit(src, 'a');

    expect(out).toEqual({});
    expect(Object.getOwnPropertySymbols(out)).toHaveLength(0);
  });

  test('should not mutate the original object', () => {
    const src = { a: 1, b: 2 };
    tspo.omit(src, 'a');
    expect(src).toEqual({ a: 1, b: 2 });
  });
});

describe('tspo.pick', () => {
  test('should pick a single key and return a new object', () => {
    const src = { id: 1, name: 'Ada' };
    const out = tspo.pick(src, 'id');

    expect(out).toEqual({ id: 1 });
    expect(out).not.toBe(src);
  });

  test('should pick multiple keys', () => {
    const src = { id: 1, name: 'Ada', email: 'ada@example.com' };
    const out = tspo.pick(src, ['id', 'email']);

    expect(out).toEqual({ id: 1, email: 'ada@example.com' });
  });

  test('should return empty object when no requested key exists', () => {
    const src = { id: 1 };
    const out = tspo.pick(src as typeof src & { missing?: number }, 'missing');

    expect(out).toEqual({});
  });

  test('should de-duplicate repeated keys', () => {
    const src = { a: 1, b: 2, c: 3 };
    const out = tspo.pick(src, ['a', 'a', 'c']);

    expect(out).toEqual({ a: 1, c: 3 });
  });

  test('should include inherited enumerable keys because implementation uses for...in', () => {
    const proto = Object.create(null) as Record<string, unknown>;
    proto.inherited = 1;

    const src = Object.create(proto) as Record<string, unknown>;
    src.own = 2;

    const out = tspo.pick(src, ['inherited'] as any);
    expect(out).toEqual({ inherited: 1 });
  });

  test('should ignore symbol keys because for...in does not enumerate symbols', () => {
    const sym = Symbol('sym');
    const src = { a: 1, [sym]: 2 };

    const out = tspo.pick(src, ['a', sym as never] as any);

    expect(out).toEqual({ a: 1 });
    expect(Object.getOwnPropertySymbols(out)).toHaveLength(0);
  });

  test('should not mutate the original object', () => {
    const src = { a: 1, b: 2 };
    tspo.pick(src, 'a');
    expect(src).toEqual({ a: 1, b: 2 });
  });
});

describe('tspo.merge', () => {
  test('should return a new object containing keys from both objects', () => {
    const a = { id: 1 };
    const b = { name: 'Ada' };
    const out = tspo.merge(a, b);

    expect(out).toEqual({ id: 1, name: 'Ada' });
    expect(out).not.toBe(a);
    expect(out).not.toBe(b);
  });

  test('should let right-hand keys overwrite collisions', () => {
    const out = tspo.merge({ a: 1, b: 2 }, { b: 9, c: 3 });
    expect(out).toEqual({ a: 1, b: 9, c: 3 });
  });

  test('should be shallow for nested objects', () => {
    const nested = { x: 1 };
    const out = tspo.merge({ a: nested }, {});

    expect(out.a).toBe(nested);
  });

  test('should not mutate either input object', () => {
    const a = { a: 1 };
    const b = { b: 2 };
    tspo.merge(a, b);

    expect(a).toEqual({ a: 1 });
    expect(b).toEqual({ b: 2 });
  });

  test('should keep enumerable symbol keys via object spread semantics', () => {
    const sym = Symbol('sym');
    const out = tspo.merge({}, { [sym]: 123 });

    expect((out as any)[sym]).toBe(123);
  });
});

describe('tspo.mergeArray', () => {
  test('should merge an array of objects into a new object', () => {
    const out = tspo.mergeArray([{ id: 1 }, { name: 'Ada' }, { active: true }]);

    expect(out).toEqual({ id: 1, name: 'Ada', active: true });
  });

  test('should let right-most entries overwrite collisions', () => {
    const out = tspo.mergeArray([{ a: 1, b: 2 }, { b: 9 }, { c: 3 }]);
    expect(out).toEqual({ a: 1, b: 9, c: 3 });
  });

  test('should keep enumerable symbol keys via Object.assign semantics', () => {
    const sym = Symbol('sym');
    const out = tspo.mergeArray([{}, { [sym]: 123 }]);

    expect((out as any)[sym]).toBe(123);
  });
});

describe('tspo.append', () => {
  test('should mutate target object in place', () => {
    const target = { a: 1 };
    const ref = target;

    tspo.append(target, { b: 2 });

    expect(target).toEqual({ a: 1, b: 2 });
    expect(target).toBe(ref);
  });

  test('should overwrite existing keys on collisions', () => {
    const target = { a: 1, b: 2 };
    tspo.append(target, { b: 9 });
    expect(target).toEqual({ a: 1, b: 9 });
  });

  test('should copy inherited enumerable keys from addOn', () => {
    const proto = Object.create(null) as Record<string, unknown>;
    proto.inherited = 1;

    const addOn = Object.create(proto) as Record<string, unknown>;
    addOn.own = 2;

    const target: Record<string, unknown> = {};
    tspo.append(target, addOn);

    expect(target).toEqual({ own: 2, inherited: 1 });
  });

  test('should ignore symbol keys from addOn', () => {
    const sym = Symbol('sym');
    const target: Record<string, unknown> = {};
    const addOn = { a: 1, [sym]: 2 };

    tspo.append(target, addOn as any);

    expect(target).toEqual({ a: 1 });
    expect((target as any)[sym]).toBeUndefined();
  });

  test('should define __proto__ behavior explicitly', () => {
    const target: Record<string, unknown> = {};
    const addOn = Object.create(null) as Record<string, unknown>;
    addOn.__proto__ = { polluted: true };

    tspo.append(target, addOn);

    expect((target as any).polluted).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(target, '__proto__')).toBe(
      false,
    );
  });
});

describe('tspo.addEntry', () => {
  test('should return a new object with one entry added', () => {
    const target = { a: 1 };
    const out = tspo.addEntry(target, ['b', 2]);

    expect(out).toEqual({ a: 1, b: 2 });
    expect(out).not.toBe(target);
    expect(target).toEqual({ a: 1 });
  });

  test('should overwrite existing keys on the returned object', () => {
    const target = { a: 1 };
    const out = tspo.addEntry(target, ['a', 9]);

    expect(out).toEqual({ a: 9 });
    expect(target).toEqual({ a: 1 });
  });

  test('should treat "__proto__" as a data key on the returned object', () => {
    const target: Record<string, unknown> = {};
    const out = tspo.addEntry(target, ['__proto__', { hacked: 1 }] as any);

    expect((out as any).hacked).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(out, '__proto__')).toBe(true);
    expect((out as any).__proto__).toEqual({ hacked: 1 });
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
  });
});

describe('tspo.addEntries', () => {
  test('should return a new object with multiple entries added', () => {
    const target = { a: 1 };
    const out = tspo.addEntries(target, [
      ['b', 2],
      ['c', 3],
    ]);

    expect(out).toEqual({ a: 1, b: 2, c: 3 });
    expect(out).not.toBe(target);
    expect(target).toEqual({ a: 1 });
  });

  test('should let later entries win on duplicate keys', () => {
    const out = tspo.addEntries({ a: 1 }, [
      ['a', 2],
      ['a', 9],
    ]);

    expect(out).toEqual({ a: 9 });
  });
});

describe('tspo.remove', () => {
  test('should delete a single key in place', () => {
    const target = { a: 1, b: 2 };
    const ref = target;

    tspo.remove(target, 'b');

    expect(target).toEqual({ a: 1 });
    expect(target).toBe(ref);
  });

  test('should delete multiple keys and tolerate duplicates', () => {
    const target = { a: 1, b: 2, c: 3 };

    tspo.remove(target, ['a', 'a', 'c']);

    expect(target).toEqual({ b: 2 });
  });

  test('should no-op when keys are missing', () => {
    const target = { a: 1 };

    tspo.remove(target as typeof target & { missing?: number }, 'missing');

    expect(target).toEqual({ a: 1 });
  });

  test('should reveal inherited property after deleting own shadowing property', () => {
    const proto = { a: 1 };
    const target = Object.create(proto) as { a: number };
    target.a = 9;

    tspo.remove(target, 'a');

    expect(target.a).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(target, 'a')).toBe(false);
  });
});

describe('tspo.index', () => {
  test('should return existing own value', () => {
    expect(tspo.index({ a: 1 }, 'a')).toBe(1);
  });

  test('should return inherited values when key exists on prototype chain', () => {
    const proto = { a: 1 };
    const obj = Object.create(proto) as { a: number };

    expect(tspo.index(obj, 'a')).toBe(1);
  });

  test('should return undefined for missing key', () => {
    expect(tspo.index({ a: 1 }, 'missing')).toBeUndefined();
  });

  test('should support numeric key input', () => {
    const obj = { 1: 'one' };
    expect(tspo.index(obj, 1)).toBe('one');
  });
});

describe('tspo.safeIndex', () => {
  test('should return existing own value', () => {
    expect(tspo.safeIndex({ a: 1 }, 'a')).toBe(1);
  });

  test('should return inherited values when key exists on prototype chain', () => {
    const proto = { a: 1 };
    const obj = Object.create(proto) as { a: number };

    expect(tspo.safeIndex(obj, 'a')).toBe(1);
  });

  test('should throw for missing key and include key in message', () => {
    expect(() => tspo.safeIndex({ a: 1 }, 'missing')).toThrowError(
      'safeIndex was passed a key not present on the object. key: missing',
    );
  });
});

describe('tspo.reverseIndex', () => {
  test('should return all matching keys', () => {
    expect(tspo.reverseIndex({ a: 1, b: 2, c: 1 }, 1)).toEqual(['a', 'c']);
  });

  test('should return empty array when there is no match', () => {
    expect(tspo.reverseIndex({ a: 1 }, 9)).toEqual([]);
  });

  test('should use strict equality (===) and not perform type coercion', () => {
    expect(tspo.reverseIndex({ a: 1, b: '1' }, '1')).toEqual(['b']);
  });

  test('should not treat NaN as equal to NaN because strict equality is used', () => {
    expect(tspo.reverseIndex({ a: Number.NaN }, Number.NaN)).toEqual([]);
  });

  test('should include inherited enumerable keys because implementation uses for...in', () => {
    const proto = Object.create(null) as Record<string, unknown>;
    proto.inherited = 1;

    const obj = Object.create(proto) as Record<string, unknown>;
    obj.own = 1;

    expect(tspo.reverseIndex(obj, 1)).toEqual(['own', 'inherited']);
  });
});

describe('tspo.safeReverseIndex', () => {
  test('should return key when exactly one match exists', () => {
    expect(tspo.safeReverseIndex({ a: 1, b: 2 }, 2)).toBe('b');
  });

  test('should throw when no key matches', () => {
    expect(() => tspo.safeReverseIndex({ a: 1 }, 9)).toThrowError(
      '.safeReverseIndex found 0 or more than 1 keys for value: 9',
    );
  });

  test('should throw when multiple keys match', () => {
    expect(() => tspo.safeReverseIndex({ a: 1, b: 1 }, 1)).toThrowError(
      '.safeReverseIndex found 0 or more than 1 keys for value: 1',
    );
  });

  test('should include inherited enumerable keys when determining uniqueness', () => {
    const proto = Object.create(null) as Record<string, unknown>;
    proto.inherited = 1;

    const obj = Object.create(proto) as Record<string, unknown>;
    obj.own = 2;

    expect(tspo.safeReverseIndex(obj, 1)).toBe('inherited');
  });
});

describe('tspo.isKey', () => {
  test('should return true for existing own string key', () => {
    expect(tspo.isKey({ a: 1 }, 'a')).toBe(true);
  });

  test('should return true for inherited string key because it uses "in"', () => {
    const proto = { a: 1 };
    const obj = Object.create(proto) as { a: number };

    expect(tspo.isKey(obj, 'a')).toBe(true);
  });

  test('should return false for missing key', () => {
    expect(tspo.isKey({ a: 1 }, 'missing')).toBe(false);
  });

  test('should return false for symbol keys even when present', () => {
    const sym = Symbol('sym');
    const obj = { [sym]: 1 };

    expect(tspo.isKey(obj as any, sym)).toBe(false);
  });

  test('should return false for numeric PropertyKey input', () => {
    expect(tspo.isKey({ 1: 'one' }, 1)).toBe(false);
  });

  test('should return false when an array is passed at runtime', () => {
    expect(tspo.isKey({ a: 1 } as any, ['a'] as any)).toBe(false);
  });
});

describe('tspo.isValue', () => {
  test('should return true when value exists in the object', () => {
    expect(tspo.isValue({ a: 1, b: 2 }, 2)).toBe(true);
  });

  test('should return false when value does not exist', () => {
    expect(tspo.isValue({ a: 1, b: 2 }, 9)).toBe(false);
  });

  test('should support array input and require every candidate value to exist', () => {
    expect(tspo.isValue({ a: 1, b: 2, c: 3 }, [1, 3] as any)).toBe(true);
    expect(tspo.isValue({ a: 1, b: 2, c: 3 }, [1, 4] as any)).toBe(false);
  });

  test('should treat NaN as present when object values include NaN (Set semantics)', () => {
    expect(tspo.isValue({ a: Number.NaN }, Number.NaN)).toBe(true);
  });

  test('should compare objects by reference identity, not deep equality', () => {
    const ref = { x: 1 };
    expect(tspo.isValue({ a: ref }, { x: 1 })).toBe(false);
    expect(tspo.isValue({ a: ref }, ref)).toBe(true);
  });
});

describe('tspo.isDict', () => {
  test('should return true for plain objects with string keys', () => {
    expect(tspo.isDict({ a: 1, b: 'x' })).toBe(true);
  });

  test('should return true for null-prototype objects with string keys', () => {
    const obj = Object.create(null) as Record<string, unknown>;
    obj.a = 1;
    expect(tspo.isDict(obj)).toBe(true);
  });

  test('should return false when object has symbol keys', () => {
    const sym = Symbol('sym');
    expect(tspo.isDict({ [sym]: 1 })).toBe(false);
  });

  test('should return false for non-plain values', () => {
    class User {}
    expect(tspo.isDict(null)).toBe(false);
    expect(tspo.isDict([1, 2, 3])).toBe(false);
    expect(tspo.isDict(new Date())).toBe(false);
    expect(tspo.isDict(new User())).toBe(false);
  });

  test('should narrow unknown to Record<string, unknown>', () => {
    const value: unknown = { a: 1 };
    if (!tspo.isDict(value)) {
      throw new Error('expected value to be a dict');
    }
    const rec: Record<string, unknown> = value;
    expect(rec.a).toBe(1);
  });
});

describe('tspo.keys', () => {
  test('should return own enumerable string keys only', () => {
    expect(tspo.keys({ a: 1, b: 2 })).toEqual(['a', 'b']);
  });

  test('should not include inherited or symbol keys', () => {
    const sym = Symbol('sym');
    const proto = { inherited: 1 };
    const obj = Object.create(proto) as Record<string | symbol, unknown>;
    obj.a = 1;
    obj[sym] = 2;

    expect(tspo.keys(obj)).toEqual(['a']);
  });

  test('should follow JavaScript key ordering rules', () => {
    const obj = { b: 2, 1: 1, a: 3 };
    expect(tspo.keys(obj)).toEqual(['1', 'b', 'a']);
  });

  test('should return [] for empty objects', () => {
    expect(tspo.keys({})).toEqual([]);
  });
});

describe('tspo.values', () => {
  test('should return own enumerable string-keyed values only', () => {
    expect(tspo.values({ a: 1, b: 2 })).toEqual([1, 2]);
  });

  test('should not include inherited or symbol-keyed values', () => {
    const sym = Symbol('sym');
    const proto = { inherited: 1 };
    const obj = Object.create(proto) as Record<string | symbol, unknown>;
    obj.a = 2;
    obj[sym] = 3;

    expect(tspo.values(obj)).toEqual([2]);
  });

  test('should follow same ordering as keys', () => {
    const obj = { b: 2, 1: 1, a: 3 };
    expect(tspo.values(obj)).toEqual([1, 2, 3]);
  });

  test('should return [] for empty objects', () => {
    expect(tspo.values({})).toEqual([]);
  });
});

describe('tspo.entries', () => {
  test('should return own enumerable string-keyed entries only', () => {
    expect(tspo.entries({ a: 1, b: 2 })).toEqual([
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

    expect(tspo.entries(obj)).toEqual([['a', 2]]);
  });

  test('should follow JavaScript entry ordering rules', () => {
    const obj = { b: 2, 1: 1, a: 3 };
    expect(tspo.entries(obj)).toEqual([
      ['1', 1],
      ['b', 2],
      ['a', 3],
    ]);
  });

  test('should return [] for empty objects', () => {
    expect(tspo.entries({})).toEqual([]);
  });
});

describe('tspo.firstEntry', () => {
  test('should return first entry according to JavaScript enumeration order', () => {
    expect(tspo.firstEntry({ id: 1, name: 'Ada' })).toEqual(['id', 1]);
  });

  test('should prioritize integer-like keys before insertion-order string keys', () => {
    expect(tspo.firstEntry({ b: 2, 1: 1, a: 3 })).toEqual(['1', 1]);
  });

  test('should return undefined at runtime for empty object', () => {
    expect(tspo.firstEntry({} as any)).toBeUndefined();
  });

  test('should ignore symbol keys', () => {
    const sym = Symbol('sym');
    const obj = { [sym]: 2, a: 1 };
    expect(tspo.firstEntry(obj)).toEqual(['a', 1]);
  });
});

describe('tspo.iterate', () => {
  test('should no-op when root is not a plain-object', () => {
    class User {}
    const cb = vi.fn();

    tspo.iterate(null, cb);
    tspo.iterate(1, cb);
    tspo.iterate('x', cb);
    tspo.iterate([1, 2], cb);
    tspo.iterate(new Date(), cb);
    tspo.iterate(new User(), cb);

    expect(cb).not.toHaveBeenCalled();
  });

  test('should recurse into nested plain objects', () => {
    const root = { a: { b: 1, c: { d: 2 } } };
    const seen: Array<{
      path: readonly (string | number)[];
      key: string | number;
      value: unknown;
    }> = [];

    tspo.iterate(root, ({ path, key, value }) => {
      seen.push({ path: [...path], key, value });
    });

    expect(seen).toEqual([
      { path: [], key: 'a', value: root.a },
      { path: ['a'], key: 'b', value: 1 },
      { path: ['a'], key: 'c', value: root.a.c },
      { path: ['a', 'c'], key: 'd', value: 2 },
    ]);
  });

  test('should recurse into arrays nested inside plain objects', () => {
    const root = { arr: [1, { x: 2 }] };
    const seen: Array<{
      path: readonly (string | number)[];
      key: string | number;
      value: unknown;
    }> = [];

    tspo.iterate(root, ({ path, key, value }) => {
      seen.push({ path: [...path], key, value });
    });

    expect(seen).toEqual([
      { path: [], key: 'arr', value: root.arr },
      { path: ['arr'], key: 0, value: 1 },
      { path: ['arr'], key: 1, value: root.arr[1] },
      { path: ['arr', 1], key: 'x', value: 2 },
    ]);
  });

  test('should recurse into nested Object.create(null) objects', () => {
    const bare = Object.create(null) as Record<string, unknown>;
    bare.leaf = 42;
    const root = { bare };

    const cb = vi.fn();
    tspo.iterate(root, cb);

    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenNthCalledWith(1, {
      parent: root,
      key: 'bare',
      value: bare,
      path: [],
    });
    expect(cb).toHaveBeenNthCalledWith(2, {
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
    tspo.iterate({ map, set, date, reg }, ({ key }) => keys.push(key));

    expect(keys).toEqual(['map', 'set', 'date', 'reg']);
  });

  test('should provide path to parent node for object-only nesting', () => {
    const seen: Array<{
      path: readonly (string | number)[];
      key: string | number;
    }> = [];

    tspo.iterate({ a: { b: { c: 1 } } }, ({ path, key }) => {
      seen.push({ path: [...path], key });
    });

    expect(seen).toEqual([
      { path: [], key: 'a' },
      { path: ['a'], key: 'b' },
      { path: ['a', 'b'], key: 'c' },
    ]);
  });

  test('should pass the actual parent reference to callback', () => {
    const root = { a: { b: 1 } };
    let parentRef: unknown;

    tspo.iterate(root, ({ parent, key }) => {
      if (key === 'b') parentRef = parent;
    });

    expect(parentRef).toBe(root.a);
  });

  test('should ignore non-enumerable and symbol keys', () => {
    const sym = Symbol('sym');
    const root: Record<string | symbol, unknown> = { visible: 1, [sym]: 2 };
    Object.defineProperty(root, 'hidden', { value: 3, enumerable: false });

    const keys: Array<string | number> = [];
    tspo.iterate(root, ({ key }) => keys.push(key));

    expect(keys).toEqual(['visible']);
  });

  test('should emit zero callbacks for empty root object', () => {
    const cb = vi.fn();
    tspo.iterate({}, cb);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('tspo.copy', () => {
  test('should deep-copy plain-object and array branches', () => {
    const src = {
      a: { b: 1 },
      arr: [{ c: 2 }, [3]],
    };

    const out = tspo.copy(src);

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

    const out = tspo.copy(src);

    expect(Object.getPrototypeOf(out)).toBeNull();
    expect(out).not.toBe(src);
    expect(out.nested as object).not.toBe(src.nested);
  });

  test('should copy nested Date values by epoch', () => {
    const src = { date: new Date('2024-01-01T00:00:00.000Z') };
    const out = tspo.copy(src);

    expect(out.date).not.toBe(src.date);
    expect(out.date.getTime()).toBe(src.date.getTime());
  });

  test('should reset nested Date values when resetDates is true', () => {
    const src = {
      date: new Date('2024-01-01T00:00:00.000Z'),
      nested: { date: new Date('2024-01-02T00:00:00.000Z') },
      arr: [new Date('2024-01-03T00:00:00.000Z')],
    };
    const before = Date.now();
    const out = tspo.copy(src, { resetDates: true });
    const after = Date.now();

    expect(out.date).not.toBe(src.date);
    expect(out.date.getTime()).toBeGreaterThanOrEqual(before);
    expect(out.date.getTime()).toBeLessThanOrEqual(after);
    expect(out.nested.date).not.toBe(src.nested.date);
    expect(out.nested.date.getTime()).toBeGreaterThanOrEqual(before);
    expect(out.nested.date.getTime()).toBeLessThanOrEqual(after);
    expect(out.arr[0]).not.toBe(src.arr[0]);
    expect(out.arr[0].getTime()).toBeGreaterThanOrEqual(before);
    expect(out.arr[0].getTime()).toBeLessThanOrEqual(after);
  });

  test('should shallow-clone nested Map and Set values', () => {
    const keyRef = { id: 1 };
    const valueRef = { name: 'Ada' };
    const memberRef = { role: 'admin' };

    const src = {
      map: new Map([[keyRef, valueRef]]),
      set: new Set([memberRef]),
    };
    const out = tspo.copy(src);

    expect(out.map).not.toBe(src.map);
    expect(out.set).not.toBe(src.set);
    expect([...out.map.keys()][0]).toBe(keyRef);
    expect([...out.map.values()][0]).toBe(valueRef);
    expect([...out.set][0]).toBe(memberRef);
  });

  test('should deep-clone nested Map and Set values when deepCloneAll is true', () => {
    const keyRef = { id: 1 };
    const valueRef = { profile: { name: 'Ada' } };
    const memberRef = { role: { level: 1 } };

    const src = {
      map: new Map([[keyRef, valueRef]]),
      set: new Set([memberRef]),
    };
    const out = tspo.copy(src, { deepCloneAll: true });

    const outKey = [...out.map.keys()][0] as typeof keyRef;
    const outValue = [...out.map.values()][0] as typeof valueRef;
    const outMember = [...out.set][0] as typeof memberRef;

    expect(out.map).not.toBe(src.map);
    expect(out.set).not.toBe(src.set);
    expect(outKey).not.toBe(keyRef);
    expect(outValue).not.toBe(valueRef);
    expect(outValue.profile).not.toBe(valueRef.profile);
    expect(outMember).not.toBe(memberRef);
    expect(outMember.role).not.toBe(memberRef.role);
    expect(outKey).toEqual(keyRef);
    expect(outValue).toEqual(valueRef);
    expect(outMember).toEqual(memberRef);
  });

  test('should clone nested RegExp and preserve source/flags/lastIndex', () => {
    const re = /ab/gi;
    re.lastIndex = 2;

    const src = { re };
    const out = tspo.copy(src);

    expect(out.re).not.toBe(re);
    expect(out.re.source).toBe('ab');
    expect(out.re.flags).toBe('gi');
    expect(out.re.lastIndex).toBe(2);
  });

  test('should clone nested typed arrays with independent buffers', () => {
    const src = { typed: new Uint8Array([1, 2, 3]) };
    const out = tspo.copy(src);

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
    const out = tspo.copy(src);

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
    const out = tspo.copy(src);

    expect(out.user).not.toBe(user);
    expect(out.user instanceof User).toBe(true);
    expect(Object.getPrototypeOf(out.user)).toBe(User.prototype);
    expect(out.user.meta).toBe(user.meta);
  });

  test('should deep-clone nested class instance props when deepCloneAll is true', () => {
    class User {
      constructor(
        public name: string,
        public meta: { level: number; tags: string[] },
      ) {}
    }
    const user = new User('Ada', { level: 1, tags: ['staff'] });

    const src = { user };
    const out = tspo.copy(src, { deepCloneAll: true });

    expect(out.user).not.toBe(user);
    expect(out.user instanceof User).toBe(true);
    expect(Object.getPrototypeOf(out.user)).toBe(User.prototype);
    expect(out.user.meta).not.toBe(user.meta);
    expect(out.user.meta.tags).not.toBe(user.meta.tags);
    expect(out.user).toEqual(user);
  });

  test('should combine deepCloneAll and resetDates for non-plain branches', () => {
    const srcDate = new Date('2024-01-01T00:00:00.000Z');
    const src = {
      map: new Map([['createdAt', srcDate]]),
    };
    const before = Date.now();
    const out = tspo.copy(src, { deepCloneAll: true, resetDates: true });
    const after = Date.now();

    const outDate = out.map.get('createdAt') as Date;
    expect(outDate).not.toBe(srcDate);
    expect(outDate.getTime()).toBeGreaterThanOrEqual(before);
    expect(outDate.getTime()).toBeLessThanOrEqual(after);
  });

  test('should keep nested function references unchanged', () => {
    const fn = () => 'hello';
    const src = { fn, arr: [fn] };

    const out = tspo.copy(src);

    expect(out.fn).toBe(fn);
    expect(out.arr[0]).toBe(fn);
  });

  test('should ignore symbol and non-enumerable keys on plain-object branches', () => {
    const sym = Symbol('sym');
    const src = { visible: 1, [sym]: 2 } as Record<string | symbol, unknown>;
    Object.defineProperty(src, 'hidden', { value: 3, enumerable: false });

    const out = tspo.copy(src as Record<string, unknown>);

    expect(out).toEqual({ visible: 1 });
    expect(Object.getOwnPropertySymbols(out)).toHaveLength(0);
    expect((out as any).hidden).toBeUndefined();
  });

  test('should throw for non-plain root values', () => {
    class User {}

    expect(() => tspo.copy([1, 2] as unknown as object)).toThrowError(
      'copy only accepts a plain-object as the root value',
    );
    expect(() => tspo.copy(new Date() as unknown as object)).toThrowError(
      'copy only accepts a plain-object as the root value',
    );
    expect(() => tspo.copy(new User() as unknown as object)).toThrowError(
      'copy only accepts a plain-object as the root value',
    );
  });

  test('should throw for circular references (not supported)', () => {
    const src: Record<string, unknown> = {};
    src.self = src;

    expect(() => tspo.copy(src)).toThrow();
  });
});

describe('tspo.compare', () => {
  test('should throw if either root is not a plain-object', () => {
    expect(() => tspo.compare(null as any, {} as any)).toThrowError(
      'compare only works for plain-objects',
    );
    expect(() => tspo.compare({} as any, null as any)).toThrowError(
      'compare only works for plain-objects',
    );
    expect(() => tspo.compare([1] as any, [1] as any)).toThrowError(
      'compare only works for plain-objects',
    );
    expect(() =>
      tspo.compare(new Date() as any, new Date() as any),
    ).toThrowError('compare only works for plain-objects');
  });

  test('should compare nested plain-objects deeply', () => {
    expect(tspo.compare({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    expect(tspo.compare({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
  });

  test('should recurse through arrays', () => {
    expect(tspo.compare({ arr: [1, { x: 2 }] }, { arr: [1, { x: 2 }] })).toBe(
      true,
    );
    expect(tspo.compare({ arr: [1, { x: 2 }] }, { arr: [1, { x: 3 }] })).toBe(
      false,
    );
  });

  test('should compare Date values by epoch', () => {
    const a = { d: new Date('2024-01-01T00:00:00.000Z') };
    const b = { d: new Date('2024-01-01T00:00:00.000Z') };
    const c = { d: new Date('2024-01-02T00:00:00.000Z') };

    expect(tspo.compare(a, b)).toBe(true);
    expect(tspo.compare(a, c)).toBe(false);
  });

  test('should compare nested non-plain objects by reference', () => {
    const shared = new Set([1]);

    expect(tspo.compare({ s: shared }, { s: shared })).toBe(true);
    expect(tspo.compare({ s: new Set([1]) }, { s: new Set([1]) })).toBe(false);
  });

  test('should return false for key-count mismatch and missing keys', () => {
    expect(tspo.compare({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(tspo.compare({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false);
  });

  test('should use Object.is semantics for primitives', () => {
    expect(tspo.compare({ n: Number.NaN }, { n: Number.NaN })).toBe(true);
    expect(tspo.compare({ n: +0 }, { n: -0 })).toBe(false);
  });

  test('should ignore symbol keys because Object.keys is used', () => {
    const sym = Symbol('sym');
    const a = { x: 1, [sym]: 1 };
    const b = { x: 1, [sym]: 2 };

    expect(tspo.compare(a, b)).toBe(true);
  });

  test('should ignore non-enumerable keys because Object.keys is used', () => {
    const a = { x: 1 } as Record<string, unknown>;
    const b = { x: 1 } as Record<string, unknown>;

    Object.defineProperty(a, 'hidden', { value: 1, enumerable: false });
    Object.defineProperty(b, 'hidden', { value: 2, enumerable: false });

    expect(tspo.compare(a, b)).toBe(true);
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

    expect(tspo.compare(a, b)).toBe(true);
  });
});
