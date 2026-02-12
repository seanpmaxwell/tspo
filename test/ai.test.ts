import { describe, expect, test } from 'vitest';

import pojo from '../src';

describe('Utilities', () => {
  describe('.copy', () => {
    test('.copy should recurse into plain-objects and arrays', () => {
      const src = {
        id: 1,
        profile: { name: 'joe' },
        jobs: ['janitor', { title: 'cashier' }],
      };
      const out = pojo.copy(src);

      expect(out).toStrictEqual(src);
      expect(out).not.toBe(src);
      expect(out.profile).not.toBe(src.profile);
      expect(out.jobs).not.toBe(src.jobs);
      expect(out.jobs[1]).not.toBe(src.jobs[1]);
    });

    test('.copy should copy nested Date by epoch', () => {
      const src = {
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      };
      const out = pojo.copy(src);

      expect(out.createdAt).not.toBe(src.createdAt);
      expect(out.createdAt.getTime()).toBe(src.createdAt.getTime());
    });

    test('.copy should shallow-clone nested non-plain objects', () => {
      const valueRef = { id: 1 };
      const src = {
        map: new Map([['k', valueRef]]),
        set: new Set([valueRef]),
      };
      const out = pojo.copy(src);

      expect(out.map).not.toBe(src.map);
      expect(out.set).not.toBe(src.set);
      expect(out.map.get('k')).toBe(valueRef);
      expect([...out.set][0]).toBe(valueRef);
    });

    test('.copy should throw when root value is not a plain-object', () => {
      expect(() => pojo.copy(new Date())).toThrowError(
        'copy only accepts a plain-object as the root value',
      );
      expect(() => pojo.copy([1, 2, 3] as unknown as object)).toThrowError(
        'copy only accepts a plain-object as the root value',
      );
    });
  });
});
