import { describe, expect, expectTypeOf, test, vi } from 'vitest';

import pojo, { OmitRemoved } from '../src';

describe('src/index.ts export contract', () => {
  test('should expose the documented default API surface (is, omit, pick, merge, append, appendOne, remove, index, safeIndex, reverseIndex, safeReverseIndex, fill, isKey, isValue, keys, values, entries, firstEntry, iterate, clone)', () => {
    expect(Object.keys(pojo)).toEqual([
      'is',
      'omit',
      'pick',
      'merge',
      'append',
      'appendOne',
      'index',
      'remove',
      'safeIndex',
      'reverseIndex',
      'safeReverseIndex',
      'isKey',
      'isValue',
      'keys',
      'values',
      'entries',
      'firstEntry',
      'fill',
      'iterate',
      'clone',
    ]);
  });

  test('should keep append, appendOne, and remove as assertion-based mutating helpers with narrowed post-call types', () => {
    const target: { id: number; email: string } = {
      id: 1,
      email: 'user@example.com',
    };

    pojo.append(target, { name: 'Ada' });
    pojo.appendOne(target, ['role', 'admin']);
    pojo.remove(target, 'email');

    expect(target).toEqual({ id: 1, name: 'Ada', role: 'admin' });
    expectTypeOf(target).toMatchTypeOf<{
      id: number;
      email: never;
      name: string;
      role: string;
    }>();
  });

  test('should export OmitRemoved<T> for removing never-valued keys after remove()', () => {
    const data = { id: 1, secret: 'x' };
    pojo.remove(data, 'secret');

    type PublicData = OmitRemoved<typeof data>;
    const publicData: PublicData = { id: data.id };

    expect(publicData).toEqual({ id: 1 });
    expectTypeOf(publicData).toMatchTypeOf<{ id: number }>();
  });
});

describe('pojo.is', () => {
  test('should return true for object literals', () => {
    expect(pojo.is({ a: 1 })).toBe(true);
  });

  test('should return true for Object.create(null) objects', () => {
    expect(pojo.is(Object.create(null))).toBe(true);
  });

  test('should return false for null and all primitives (string, number, boolean, bigint, symbol, undefined)', () => {
    expect(pojo.is(null)).toBe(false);
    expect(pojo.is('x')).toBe(false);
    expect(pojo.is(1)).toBe(false);
    expect(pojo.is(false)).toBe(false);
    expect(pojo.is(1n)).toBe(false);
    expect(pojo.is(Symbol('s'))).toBe(false);
    expect(pojo.is(undefined)).toBe(false);
  });

  test('should return false for arrays', () => {
    expect(pojo.is([1, 2, 3])).toBe(false);
  });

  test('should return false for non-POJO objects (Date, Map, Set, RegExp, class instances)', () => {
    class User {}
    expect(pojo.is(new Date())).toBe(false);
    expect(pojo.is(new Map())).toBe(false);
    expect(pojo.is(new Set())).toBe(false);
    expect(pojo.is(/abc/g)).toBe(false);
    expect(pojo.is(new User())).toBe(false);
  });
});

describe('pojo.omit', () => {
  test('should omit a single key and return a new object', () => {
    const src = { id: 1, name: 'Ada' };
    const out = pojo.omit(src, 'id');

    expect(out).toEqual({ name: 'Ada' });
    expect(out).not.toBe(src);
  });

  test('should omit multiple keys and return a new object', () => {
    const src = { id: 1, name: 'Ada', email: 'ada@example.com' };
    const out = pojo.omit(src, ['id', 'email']);
    expect(out).toEqual({ name: 'Ada' });
  });

  test('should not mutate the original object', () => {
    const src = { id: 1, name: 'Ada' };
    pojo.omit(src, 'id');
    expect(src).toEqual({ id: 1, name: 'Ada' });
  });

  test('should ignore keys that do not exist on the source object', () => {
    const src = { id: 1, name: 'Ada' };
    const out = pojo.omit(src as typeof src & { missing?: string }, 'missing');
    expect(out).toEqual(src);
  });

  test('should return a shallow copy when given an empty key list', () => {
    const nested = { value: 1 };
    const src = { nested };
    const out = pojo.omit(src, [] as (keyof typeof src)[]);

    expect(out).toEqual(src);
    expect(out).not.toBe(src);
    expect(out.nested).toBe(nested);
  });

  test('should de-duplicate repeated keys in the keys array', () => {
    const src = { id: 1, name: 'Ada', email: 'ada@example.com' };
    const out = pojo.omit(src, ['email', 'email']);
    expect(out).toEqual({ id: 1, name: 'Ada' });
  });

  test('should include inherited enumerable keys because iteration uses for...in', () => {
    const proto = { inherited: 2 };
    const src = Object.create(proto) as { own: number; inherited: number };
    src.own = 1;

    const out = pojo.omit(src, 'own');
    expect(out).toEqual({ inherited: 2 });
  });

  test('should ignore symbol keys because for...in does not enumerate symbols', () => {
    const sym = Symbol('sym');
    const src = { id: 1, [sym]: 'hidden' };
    const out = pojo.omit(src, [] as (keyof typeof src)[]);

    expect(out).toEqual({ id: 1 });
    expect(Object.getOwnPropertySymbols(out)).toHaveLength(0);
  });
});

describe('pojo.pick', () => {
  test('should pick a single key and return a new object', () => {
    const src = { id: 1, name: 'Ada' };
    const out = pojo.pick(src, 'name');

    expect(out).toEqual({ name: 'Ada' });
    expect(out).not.toBe(src);
  });

  test('should pick multiple keys and return a new object', () => {
    const src = { id: 1, name: 'Ada', email: 'ada@example.com' };
    const out = pojo.pick(src, ['id', 'name']);
    expect(out).toEqual({ id: 1, name: 'Ada' });
  });

  test('should return an empty object when no requested keys exist', () => {
    const src = { id: 1, name: 'Ada' };
    const out = pojo.pick(src as typeof src & { missing?: string }, 'missing');
    expect(out).toEqual({});
  });

  test('should not mutate the original object', () => {
    const src = { id: 1, name: 'Ada' };
    pojo.pick(src, 'id');
    expect(src).toEqual({ id: 1, name: 'Ada' });
  });

  test('should de-duplicate repeated keys in the keys array', () => {
    const src = { id: 1, name: 'Ada' };
    const out = pojo.pick(src, ['name', 'name']);
    expect(out).toEqual({ name: 'Ada' });
  });

  test('should include inherited enumerable keys because iteration uses for...in', () => {
    const proto = { inherited: 'proto' };
    const src = Object.create(proto) as { own: string; inherited: string };
    src.own = 'own';

    const out = pojo.pick(src, 'inherited');
    expect(out).toEqual({ inherited: 'proto' });
  });

  test('should ignore symbol keys because for...in does not enumerate symbols', () => {
    const sym = Symbol('sym');
    const src = { id: 1, [sym]: 'hidden' };
    const out = pojo.pick(src as typeof src, [sym] as (keyof typeof src)[]);

    expect(out).toEqual({});
    expect(Object.getOwnPropertySymbols(out)).toHaveLength(0);
  });
});

describe('pojo.merge', () => {
  test('should return a new object containing keys from both inputs', () => {
    const a = { id: 1 };
    const b = { name: 'Ada' };
    const out = pojo.merge(a, b);

    expect(out).toEqual({ id: 1, name: 'Ada' });
    expect(out).not.toBe(a);
    expect(out).not.toBe(b);
  });

  test('should let right-hand keys overwrite left-hand keys on collisions', () => {
    const out = pojo.merge({ id: 1, name: 'Ada' }, { name: 'Grace' });
    expect(out).toEqual({ id: 1, name: 'Grace' });
  });

  test('should not mutate either input object', () => {
    const a = { id: 1 };
    const b = { name: 'Ada' };
    pojo.merge(a, b);

    expect(a).toEqual({ id: 1 });
    expect(b).toEqual({ name: 'Ada' });
  });

  test('should perform a shallow merge for nested objects', () => {
    const nestedA = { theme: 'light' };
    const nestedB = { theme: 'dark' };
    const out = pojo.merge({ config: nestedA }, { config: nestedB });

    expect(out.config).toBe(nestedB);
  });

  test('should handle empty objects on either side', () => {
    expect(pojo.merge({}, { a: 1 })).toEqual({ a: 1 });
    expect(pojo.merge({ a: 1 }, {})).toEqual({ a: 1 });
  });
});

describe('pojo.append', () => {
  test('should mutate the first object by copying keys from the second object', () => {
    const target = { id: 1 };
    pojo.append(target, { name: 'Ada' });
    expect(target).toEqual({ id: 1, name: 'Ada' });
  });

  test('should overwrite existing keys on collisions', () => {
    const target = { id: 1, name: 'Ada' };
    pojo.append(target, { name: 'Grace' });
    expect(target.name).toBe('Grace');
  });

  test('should no-op when addOn is empty', () => {
    const target = { id: 1 };
    pojo.append(target, {});
    expect(target).toEqual({ id: 1 });
  });

  test('should copy inherited enumerable keys from addOn because iteration uses for...in', () => {
    const proto = { inherited: 'proto' };
    const addOn = Object.create(proto) as { own: string; inherited: string };
    addOn.own = 'own';
    const target = { id: 1 };

    pojo.append(target, addOn);
    expect(target).toEqual({ id: 1, own: 'own', inherited: 'proto' });
  });

  test('should ignore symbol keys on addOn because for...in does not enumerate symbols', () => {
    const sym = Symbol('sym');
    const addOn = { visible: 1, [sym]: 2 };
    const target: Record<string | symbol, unknown> = {};

    pojo.append(target, addOn);
    expect(target.visible).toBe(1);
    expect(target[sym]).toBeUndefined();
  });

  test('should preserve object identity (same reference before and after append)', () => {
    const target = { id: 1 };
    const ref = target;
    pojo.append(target, { name: 'Ada' });
    expect(target).toBe(ref);
  });
});

describe('pojo.appendOne', () => {
  test('should mutate the target object by adding one key/value pair', () => {
    const target = { id: 1 };
    pojo.appendOne(target, ['name', 'Ada']);
    expect(target).toEqual({ id: 1, name: 'Ada' });
  });

  test('should overwrite an existing key when the entry key already exists', () => {
    const target = { id: 1 };
    pojo.appendOne(target, ['id', 2]);
    expect(target.id).toBe(2);
  });

  test('should preserve object identity (same reference before and after appendOne)', () => {
    const target = { id: 1 };
    const ref = target;
    pojo.appendOne(target, ['name', 'Ada']);
    expect(target).toBe(ref);
  });

  test('should define expected behavior when key is "__proto__" to prevent accidental prototype mutation', () => {
    const target: Record<string, unknown> = {};
    const injectedProto = { injected: true };

    pojo.appendOne(target, ['__proto__', injectedProto] as ['__proto__', any]);
    expect(Object.getPrototypeOf(target)).toBe(injectedProto);
    expect((target as any).injected).toBe(true);
  });
});

describe('pojo.remove', () => {
  test('should delete a single key in place', () => {
    const target = { id: 1, email: 'x' };
    pojo.remove(target, 'email');
    expect(target).toEqual({ id: 1 });
  });

  test('should delete multiple keys in place', () => {
    const target = { id: 1, email: 'x', name: 'Ada' };
    pojo.remove(target, ['email', 'name']);
    expect(target).toEqual({ id: 1 });
  });

  test('should no-op when asked to remove keys that are not present', () => {
    const target = { id: 1 };
    pojo.remove(target as typeof target & { missing?: string }, 'missing');
    expect(target).toEqual({ id: 1 });
  });

  test('should keep inherited values reachable when deleting an own property that shadows a prototype property', () => {
    const proto = { value: 'proto' };
    const target = Object.create(proto) as { value: string };
    target.value = 'own';

    pojo.remove(target, 'value');
    expect(target.value).toBe('proto');
    expect(Object.hasOwn(target, 'value')).toBe(false);
  });

  test('should preserve object identity (same reference before and after remove)', () => {
    const target = { id: 1, email: 'x' };
    const ref = target;
    pojo.remove(target, 'email');
    expect(target).toBe(ref);
  });

  test('should keep remove() + OmitRemoved<T> aligned so removed keys are not present in the final usable type', () => {
    const target = { id: 1, email: 'x' };
    pojo.remove(target, 'email');

    type PublicUser = OmitRemoved<typeof target>;
    const publicUser: PublicUser = { id: target.id };

    expect(publicUser).toEqual({ id: 1 });
    expectTypeOf(publicUser).toMatchTypeOf<{ id: number }>();
  });
});

describe('pojo.index', () => {
  test('should return the value for an existing own key', () => {
    expect(pojo.index({ id: 1 }, 'id')).toBe(1);
  });

  test('should return inherited values when the key exists on the prototype chain', () => {
    const proto = { inherited: 2 };
    const target = Object.create(proto) as { inherited: number };
    expect(pojo.index(target, 'inherited')).toBe(2);
  });

  test('should return undefined for a missing key', () => {
    expect(pojo.index({ id: 1 }, 'missing')).toBeUndefined();
  });

  test('should work with null-prototype objects', () => {
    const target = Object.create(null) as Record<string, unknown>;
    target.id = 1;
    expect(pojo.index(target, 'id')).toBe(1);
  });
});

describe('pojo.safeIndex', () => {
  test('should return the value for an existing own key', () => {
    expect(pojo.safeIndex({ id: 1 }, 'id')).toBe(1);
  });

  test('should return inherited values when the key exists on the prototype chain', () => {
    const proto = { inherited: 2 };
    const target = Object.create(proto) as { inherited: number };
    expect(pojo.safeIndex(target, 'inherited')).toBe(2);
  });

  test('should throw when the key does not exist', () => {
    expect(() => pojo.safeIndex({ id: 1 }, 'missing')).toThrow();
  });

  test('should include the missing key name in the thrown error message', () => {
    expect(() => pojo.safeIndex({ id: 1 }, 'missing')).toThrow('missing');
  });

  test('should work with null-prototype objects for existing keys', () => {
    const target = Object.create(null) as Record<string, unknown>;
    target.id = 1;
    expect(pojo.safeIndex(target, 'id')).toBe(1);
  });
});

describe('pojo.reverseIndex', () => {
  test('should return all matching keys when multiple keys share the same value', () => {
    expect(pojo.reverseIndex({ a: 1, b: 2, c: 1 }, 1)).toEqual(['a', 'c']);
  });

  test('should return an empty array when no values match', () => {
    expect(pojo.reverseIndex({ a: 1 }, 99)).toEqual([]);
  });

  test('should use strict equality (===) and not perform coercion', () => {
    expect(pojo.reverseIndex({ a: 1, b: '1' }, '1')).toEqual(['b']);
  });

  test('should not treat NaN as equal to NaN because strict equality is used', () => {
    expect(pojo.reverseIndex({ a: Number.NaN }, Number.NaN)).toEqual([]);
  });

  test('should include inherited enumerable keys because iteration uses for...in', () => {
    const proto = { inherited: 1 };
    const target = Object.create(proto) as { own: number; inherited: number };
    target.own = 1;

    expect(pojo.reverseIndex(target, 1)).toEqual(['own', 'inherited']);
  });

  test('should return keys in JavaScript for...in enumeration order', () => {
    const proto = { p1: 1, p2: 1 };
    const target = Object.create(proto) as {
      a: number;
      b: number;
      p1: number;
      p2: number;
    };
    target.a = 1;
    target.b = 1;

    expect(pojo.reverseIndex(target, 1)).toEqual(['a', 'b', 'p1', 'p2']);
  });
});

describe('pojo.safeReverseIndex', () => {
  test('should return the key when exactly one value matches', () => {
    expect(pojo.safeReverseIndex({ a: 1, b: 2 }, 2)).toBe('b');
  });

  test('should throw when no keys match the value', () => {
    expect(() => pojo.safeReverseIndex({ a: 1 }, 2)).toThrow();
  });

  test('should throw when more than one key matches the value', () => {
    expect(() => pojo.safeReverseIndex({ a: 1, b: 1 }, 1)).toThrow();
  });

  test('should use strict equality (===) and not perform coercion', () => {
    expect(() => pojo.safeReverseIndex({ a: 1, b: '1' }, '1')).not.toThrow();
    expect(pojo.safeReverseIndex({ a: 1, b: '1' }, '1')).toBe('b');
  });

  test('should include inherited enumerable keys when evaluating uniqueness', () => {
    const proto = { inherited: 2 };
    const target = Object.create(proto) as { own: number; inherited: number };
    target.own = 1;

    expect(pojo.safeReverseIndex(target, 2)).toBe('inherited');
  });

  test('should include the searched value in the thrown error message', () => {
    expect(() => pojo.safeReverseIndex({ a: 1 }, 2)).toThrow('2');
  });
});

describe('pojo.fill', () => {
  test('should return defaults when partial is undefined', () => {
    const defaults = { retries: 3, timeout: 5000 };
    expect(pojo.fill(defaults, undefined)).toEqual(defaults);
  });

  test('should return defaults when partial is null', () => {
    const defaults = { retries: 3, timeout: 5000 };
    expect(pojo.fill(defaults, null)).toEqual(defaults);
  });

  test('should override defaults with provided partial values', () => {
    const defaults = { retries: 3, timeout: 5000 };
    expect(pojo.fill(defaults, { timeout: 8000 })).toEqual({
      retries: 3,
      timeout: 8000,
    });
  });

  test('should allow explicit undefined in partial to overwrite defaults', () => {
    const defaults = { timeout: 5000 as number | undefined };
    const out = pojo.fill(defaults, { timeout: undefined });
    expect(out.timeout).toBeUndefined();
  });

  test('should perform a shallow merge for nested objects', () => {
    const defaults = { cfg: { a: 1, b: 2 } };
    const partial = { cfg: { b: 3 } } as any;
    const out = pojo.fill(defaults, partial);

    expect(out.cfg).toBe(partial.cfg);
    expect(out.cfg).not.toBe(defaults.cfg);
  });

  test('should not mutate the defaults object', () => {
    const defaults = { retries: 3, timeout: 5000 };
    pojo.fill(defaults, { timeout: 9000 });
    expect(defaults).toEqual({ retries: 3, timeout: 5000 });
  });
});

describe('pojo.isKey', () => {
  test('should return true for existing string keys', () => {
    expect(pojo.isKey({ id: 1 }, 'id')).toBe(true);
  });

  test('should return true for inherited string keys because key lookup uses "in"', () => {
    const proto = { inherited: 1 };
    const target = Object.create(proto) as { inherited: number };
    expect(pojo.isKey(target, 'inherited')).toBe(true);
  });

  test('should return false for missing keys', () => {
    expect(pojo.isKey({ id: 1 }, 'missing')).toBe(false);
  });

  test('should return false for symbol keys even when present', () => {
    const sym = Symbol('sym');
    const target = { [sym]: 1 };
    expect(pojo.isKey(target, sym)).toBe(false);
  });

  test('should return false for numeric PropertyKey inputs even when stringified keys exist', () => {
    const target = { '1': 'one' };
    expect(pojo.isKey(target, 1)).toBe(false);
  });

  test('should define behavior for array input passed as any, since implementation branches for arrays at runtime', () => {
    expect(pojo.isKey({ id: 1 }, ['id'] as any)).toBe(false);
  });
});

describe('pojo.isValue', () => {
  test('should return true when the value exists in the object', () => {
    expect(pojo.isValue({ a: 1, b: 2 }, 2)).toBe(true);
  });

  test('should return false when the value does not exist in the object', () => {
    expect(pojo.isValue({ a: 1, b: 2 }, 3)).toBe(false);
  });

  test('should support array input and require every candidate value to exist', () => {
    expect(pojo.isValue({ a: 1, b: 2, c: 3 }, [1, 3] as any)).toBe(true);
  });

  test('should return false for array input when any one value is missing', () => {
    expect(pojo.isValue({ a: 1, b: 2 }, [1, 99] as any)).toBe(false);
  });

  test('should treat NaN as present when object values include NaN (Set semantics)', () => {
    expect(pojo.isValue({ a: Number.NaN }, Number.NaN)).toBe(true);
  });

  test('should compare object values by reference identity, not deep equality', () => {
    const ref = { id: 1 };
    const target = { a: ref };

    expect(pojo.isValue(target, ref)).toBe(true);
    expect(pojo.isValue(target, { id: 1 })).toBe(false);
  });
});

describe('pojo.keys', () => {
  test('should return own enumerable string keys only', () => {
    const target = { a: 1, b: 2 };
    expect(pojo.keys(target)).toEqual(['a', 'b']);
  });

  test('should not include inherited keys', () => {
    const proto = { inherited: 1 };
    const target = Object.create(proto) as { own: number };
    target.own = 2;

    expect(pojo.keys(target)).toEqual(['own']);
  });

  test('should not include symbol keys', () => {
    const sym = Symbol('sym');
    const target = { a: 1, [sym]: 2 };
    expect(pojo.keys(target)).toEqual(['a']);
  });

  test('should follow JavaScript key ordering rules', () => {
    const target = { 2: 'two', 1: 'one', z: 'zee', a: 'aye' };
    expect(pojo.keys(target)).toEqual(['1', '2', 'z', 'a']);
  });

  test('should return an empty array for an empty object', () => {
    expect(pojo.keys({})).toEqual([]);
  });
});

describe('pojo.values', () => {
  test('should return values for own enumerable string keys only', () => {
    expect(pojo.values({ a: 1, b: 2 })).toEqual([1, 2]);
  });

  test('should not include inherited values', () => {
    const proto = { inherited: 1 };
    const target = Object.create(proto) as { own: number };
    target.own = 2;

    expect(pojo.values(target)).toEqual([2]);
  });

  test('should not include symbol-keyed values', () => {
    const sym = Symbol('sym');
    const target = { a: 1, [sym]: 2 };
    expect(pojo.values(target)).toEqual([1]);
  });

  test('should follow the same order as pojo.keys', () => {
    const target = { 2: 'two', 1: 'one', z: 'zee', a: 'aye' };
    expect(pojo.values(target)).toEqual(['one', 'two', 'zee', 'aye']);
  });

  test('should return an empty array for an empty object', () => {
    expect(pojo.values({})).toEqual([]);
  });
});

describe('pojo.entries', () => {
  test('should return [key, value] pairs for own enumerable string keys only', () => {
    expect(pojo.entries({ a: 1, b: 2 })).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  test('should not include inherited entries', () => {
    const proto = { inherited: 1 };
    const target = Object.create(proto) as { own: number };
    target.own = 2;

    expect(pojo.entries(target)).toEqual([['own', 2]]);
  });

  test('should not include symbol-keyed entries', () => {
    const sym = Symbol('sym');
    const target = { a: 1, [sym]: 2 };
    expect(pojo.entries(target)).toEqual([['a', 1]]);
  });

  test('should follow JavaScript entry ordering rules', () => {
    const target = { 2: 'two', 1: 'one', z: 'zee', a: 'aye' };
    expect(pojo.entries(target)).toEqual([
      ['1', 'one'],
      ['2', 'two'],
      ['z', 'zee'],
      ['a', 'aye'],
    ]);
  });

  test('should return an empty array for an empty object', () => {
    expect(pojo.entries({})).toEqual([]);
  });
});

describe('pojo.firstEntry', () => {
  test('should return the first entry according to JavaScript enumeration order', () => {
    expect(pojo.firstEntry({ id: 1, name: 'Ada' })).toEqual(['id', 1]);
  });

  test('should prioritize integer-like keys before insertion-ordered string keys', () => {
    const target = { b: 2, 1: 1, a: 3 };
    expect(pojo.firstEntry(target)).toEqual(['1', 1]);
  });

  test('should return undefined at runtime for empty objects', () => {
    expect(pojo.firstEntry({} as any)).toBeUndefined();
  });

  test('should ignore symbol keys because Object.entries ignores symbols', () => {
    const sym = Symbol('sym');
    const target = { [sym]: 10, a: 1 };
    expect(pojo.firstEntry(target)).toEqual(['a', 1]);
  });
});

describe('pojo.iterate', () => {
  test('should no-op when root is not traversable (null, primitive, Date, class instance)', () => {
    class User {}
    const cb = vi.fn();

    pojo.iterate(null, cb);
    pojo.iterate(1, cb);
    pojo.iterate('x', cb);
    pojo.iterate(new Date(), cb);
    pojo.iterate(new User(), cb);

    expect(cb).not.toHaveBeenCalled();
  });

  test('should recurse into nested plain objects', () => {
    const seen: Array<{
      path: readonly (string | number)[];
      key: string;
      value: unknown;
    }> = [];

    pojo.iterate({ a: { b: 1, c: { d: 2 } } }, ({ path, key, value }) =>
      seen.push({ path, key, value }),
    );

    expect(seen).toEqual([
      { path: ['a'], key: 'b', value: 1 },
      { path: ['a', 'c'], key: 'd', value: 2 },
    ]);
  });

  test('should recurse into nested Object.create(null) objects', () => {
    const bare = Object.create(null) as Record<string, unknown>;
    bare.leaf = 42;
    const root = { bare };

    const cb = vi.fn();
    pojo.iterate(root, cb);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({
      parent: bare,
      key: 'leaf',
      value: 42,
      path: ['bare'],
    });
  });

  test('should emit callbacks for non-POJO leaf values only', () => {
    const cb = vi.fn();
    pojo.iterate({ a: { b: 1 }, c: 'leaf' }, cb);

    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenNthCalledWith(1, {
      parent: { b: 1 },
      key: 'b',
      value: 1,
      path: ['a'],
    });
    expect(cb).toHaveBeenNthCalledWith(2, {
      parent: { a: { b: 1 }, c: 'leaf' },
      key: 'c',
      value: 'leaf',
      path: [],
    });
  });

  test('should recurse into array elements and nested plain objects inside arrays', () => {
    const cb = vi.fn();
    pojo.iterate({ arr: [1, { x: 2 }] }, cb);

    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenNthCalledWith(1, {
      parent: [1, { x: 2 }],
      key: 0,
      value: 1,
      path: ['arr'],
    });
    expect(cb).toHaveBeenNthCalledWith(2, {
      parent: { x: 2 },
      key: 'x',
      value: 2,
      path: ['arr', 1],
    });
  });

  test('should recurse into root arrays', () => {
    const cb = vi.fn();
    pojo.iterate([1, { x: 2 }], cb);

    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenNthCalledWith(1, {
      parent: [1, { x: 2 }],
      key: 0,
      value: 1,
      path: [],
    });
    expect(cb).toHaveBeenNthCalledWith(2, {
      parent: { x: 2 },
      key: 'x',
      value: 2,
      path: [1],
    });
  });

  test('should treat Map, Set, Date, and RegExp values as leaf values and not recurse', () => {
    const map = new Map([['k', 1]]);
    const set = new Set([1]);
    const date = new Date('2024-01-01T00:00:00.000Z');
    const reg = /x/g;

    const seen: string[] = [];
    pojo.iterate({ map, set, date, reg }, ({ key }) => seen.push(key));

    expect(seen).toEqual(['map', 'set', 'date', 'reg']);
  });

  test('should provide path to the parent node, not the full leaf path including the current key', () => {
    const seen: Array<{
      path: readonly (string | number)[];
      key: string | number;
    }> = [];
    pojo.iterate({ a: { b: { c: 1 } } }, ({ path, key }) =>
      seen.push({ path, key }),
    );

    expect(seen).toEqual([{ path: ['a', 'b'], key: 'c' }]);
  });

  test('should pass the actual parent object reference to the callback', () => {
    const root = { a: { b: 1 } };
    let parentRef: object | undefined;

    pojo.iterate(root, ({ parent, key }) => {
      if (key === 'b') parentRef = parent;
    });

    expect(parentRef).toBe(root.a);
  });

  test('should not include non-enumerable or symbol keys', () => {
    const sym = Symbol('sym');
    const root: Record<string | symbol, unknown> = { visible: 1, [sym]: 2 };
    Object.defineProperty(root, 'hidden', {
      value: 3,
      enumerable: false,
    });

    const keys: (string | number)[] = [];
    pojo.iterate(root, ({ key }) => keys.push(key));

    expect(keys).toEqual(['visible']);
  });

  test('should emit zero callbacks for an empty root object', () => {
    const cb = vi.fn();
    pojo.iterate({}, cb);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('pojo.copy', () => {
  test('should return primitives as-is', () => {
    expect(pojo.copy(1)).toBe(1);
    expect(pojo.copy('x')).toBe('x');
    expect(pojo.copy(null)).toBeNull();
    expect(pojo.copy(undefined)).toBeUndefined();
    expect(pojo.copy(true)).toBe(true);
  });

  test('should deep clone plain objects so nested plain objects are not shared', () => {
    const src = { a: { b: 1 } };
    const out = pojo.copy(src);

    expect(out).toEqual(src);
    expect(out).not.toBe(src);
    expect(out.a).not.toBe(src.a);
  });

  test('should clone null-prototype objects while preserving null prototype', () => {
    const src = Object.create(null) as Record<string, unknown>;
    src.nested = { x: 1 };

    const out = pojo.copy(src);
    expect(Object.getPrototypeOf(out)).toBeNull();
    expect(out).not.toBe(src);
    expect(out.nested as object).not.toBe(src.nested);
  });

  test('should clone arrays and preserve length/order', () => {
    const src = [1, 2, 3];
    const out = pojo.copy(src);

    expect(out).toEqual([1, 2, 3]);
    expect(out).not.toBe(src);
  });

  test('should define whether nested arrays are deep-cloned or shallow-cloned and keep behavior explicit in tests', () => {
    const nested = [1];
    const src = [nested];
    const out = pojo.copy(src);

    expect(out).not.toBe(src);
    expect(out[0]).toBe(nested);
  });

  test('should define whether non-POJO values nested inside arrays are cloned or copied by reference', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const src = [date];
    const out = pojo.copy(src);

    expect(out).not.toBe(src);
    expect(out[0]).toBe(date);
  });

  test('should clone Date instances with equal timestamps but different references', () => {
    const src = new Date('2024-01-01T00:00:00.000Z');
    const out = pojo.copy(src);

    expect(out).not.toBe(src);
    expect(out.getTime()).toBe(src.getTime());
  });

  test('should clone RegExp instances and preserve source, flags, and lastIndex', () => {
    const src = /ab/g;
    src.lastIndex = 2;

    const out = pojo.copy(src);
    expect(out).not.toBe(src);
    expect(out.source).toBe('ab');
    expect(out.flags).toBe('g');
    expect(out.lastIndex).toBe(2);
  });

  test('should clone Map instances and define whether keys/values are deep-cloned or shallow-copied', () => {
    const keyObj = { id: 1 };
    const valueObj = { name: 'Ada' };
    const src = new Map([[keyObj, valueObj]]);
    const out = pojo.copy(src);

    expect(out).not.toBe(src);
    expect([...out.keys()][0]).toBe(keyObj);
    expect([...out.values()][0]).toBe(valueObj);
  });

  test('should clone Set instances and define whether members are deep-cloned or shallow-copied', () => {
    const member = { id: 1 };
    const src = new Set([member]);
    const out = pojo.copy(src);

    expect(out).not.toBe(src);
    expect([...out][0]).toBe(member);
  });

  test('should clone ArrayBuffer with an independent underlying buffer', () => {
    const src = new ArrayBuffer(4);
    const srcView = new Uint8Array(src);
    srcView[0] = 7;

    const out = pojo.copy(src);
    const outView = new Uint8Array(out);
    outView[0] = 1;

    expect(out).not.toBe(src);
    expect(srcView[0]).toBe(7);
    expect(outView[0]).toBe(1);
  });

  test('should clone typed arrays with independent buffers', () => {
    const src = new Uint8Array([1, 2, 3]);
    const out = pojo.copy(src);
    out[0] = 9;

    expect(out).not.toBe(src);
    expect(src[0]).toBe(1);
    expect(out[0]).toBe(9);
  });

  test('should clone DataView with an independent underlying buffer', () => {
    const buffer = new ArrayBuffer(4);
    const src = new DataView(buffer);
    src.setUint8(0, 10);

    const out = pojo.copy(src);
    out.setUint8(0, 77);

    expect(out).not.toBe(src);
    expect(src.getUint8(0)).toBe(10);
    expect(out.getUint8(0)).toBe(77);
  });

  test('should preserve prototype for generic class instances', () => {
    class User {
      constructor(public name: string) {}
    }
    const src = new User('Ada');
    const out = pojo.copy(src);

    expect(out).not.toBe(src);
    expect(out instanceof User).toBe(true);
    expect(Object.getPrototypeOf(out)).toBe(User.prototype);
    expect(out.name).toBe('Ada');
  });

  test('should copy only own enumerable properties for generic non-plain objects', () => {
    class Box {
      visible = 1;
      constructor() {
        Object.defineProperty(this, 'hidden', { value: 2, enumerable: false });
      }
    }
    const src = new Box() as Box & { hidden?: number };
    const out = pojo.copy(src);

    expect(out.visible).toBe(1);
    expect((out as any).hidden).toBeUndefined();
  });

  test('should define behavior for symbol-keyed properties (copied vs omitted)', () => {
    const sym = Symbol('sym');
    const src = { a: 1, [sym]: 2 };
    const out = pojo.copy(src);

    expect(out).toEqual({ a: 1 });
    expect(Object.getOwnPropertySymbols(out)).toHaveLength(0);
  });

  test('should document and verify behavior for circular references (not supported)', () => {
    const src: Record<string, unknown> = {};
    src.self = src;

    expect(() => pojo.copy(src)).toThrow();
  });
});
