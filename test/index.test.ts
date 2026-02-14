import { describe, expect, test } from 'vitest';

import tspo, { type OmitNever } from '../src';

/******************************************************************************
                                  Dummy Data
******************************************************************************/

interface IUser {
  id: number;
  name: string;
  email: string;
}

const User = {
  id: 1,
  name: 'joe',
  email: 'joe@gmail.com',
} as const satisfies IUser;

interface IDog {
  id: number;
  name: string;
  age: number;
}

const Dog = {
  id: 2,
  name: 'fido',
  age: 11,
} as const satisfies IDog;

/******************************************************************************
                                Test
******************************************************************************/

describe('Building', () => {
  test('.omit', () => {
    const omit1 = tspo.omit(User, 'id');
    expect(omit1).toStrictEqual({ name: User.name, email: User.email });
    const omit2 = tspo.omit(User, ['id', 'name']);
    expect(omit2).toStrictEqual({ email: User.email });
  });

  test('.pick', () => {
    const pick1 = tspo.pick(User, 'id');
    expect(pick1).toStrictEqual({ id: User.id });
    const pick2 = tspo.pick(User, ['id', 'name']);
    expect(pick2).toStrictEqual({ id: User.id, name: User.name });
  });

  test('.merge', () => {
    const userDog = tspo.merge(User, Dog);
    expect(userDog).toStrictEqual({ ...User, ...Dog });
  });

  test('.mergeArray', () => {
    const userDog = tspo.mergeArray([User, Dog, { player: 'team' }]);
    expect(userDog).toStrictEqual({ ...User, ...Dog, player: 'team' });
  });

  test('.fill', () => {
    const userFull = tspo.fill(User, { id: 2 });
    expect(userFull).toStrictEqual({ ...User, id: 2 });
  });

  test('.addEntry', () => {
    const newUser = tspo.addEntry(User, ['address', '123 fake st']);
    expect(newUser).toStrictEqual({ ...User, address: '123 fake st' });
  });

  test('.addEntries', () => {
    const newUser = tspo.addEntries(User, [
      ['address', '123 fake st'],
      ['age', 5],
      ['age', '5'],
    ]);
    expect(newUser).toStrictEqual({
      ...User,
      address: '123 fake st',
      age: '5',
    });
  });
});

// -- Mutating -- //

describe('Mutating', () => {
  test('.append', () => {
    const user: IUser = { ...User },
      dog: IDog = { ...Dog };
    tspo.append(user, dog);
    expect(user).toStrictEqual({ ...User, ...Dog });
  });

  test('.remove', () => {
    const user = { ...User };
    tspo.remove(user, ['id', 'email']);
    user;
    type tuser = OmitNever<typeof user>;
    expect(user).toStrictEqual({ name: User.name });
    const user2 = { ...User };
    tspo.remove(user2, 'email');
    type tuser2 = OmitNever<typeof user2>;
    expect(user2).toStrictEqual({ id: User.id, name: User.name });
  });
});

// -- Indexing -- //

describe('Indexing', () => {
  test('.index', () => {
    const val1 = tspo.index(User, 'id');
    expect(val1).toStrictEqual(1);
    const val2 = tspo.index(User, 'idd');
    expect(val2).toStrictEqual(undefined);
  });

  test('.safeIndex', () => {
    const val1 = tspo.safeIndex(User, 'id');
    expect(val1).toStrictEqual(1);
    const getVal = () => tspo.safeIndex(User, 'idd');
    expect(() => getVal()).toThrowError();
  });

  test('.reverseIndex', () => {
    const key1 = tspo.reverseIndex(User, 1);
    expect(key1).toStrictEqual(['id']);
    const key2 = tspo.reverseIndex(User, 2);
    expect(key2).toStrictEqual([]);
  });

  test('.safeReverseIndex', () => {
    const key1 = tspo.safeReverseIndex(User, 1);
    expect(key1).toStrictEqual('id');
    const getVal = () => tspo.safeReverseIndex(User, 2);
    expect(() => getVal()).toThrowError();
  });
});

// -- Validator-functions -- //

describe('Validator-functions', () => {
  test('.is', () => {
    expect(tspo.is(User)).toStrictEqual(true);
    expect(tspo.is([])).toStrictEqual(false);
  });

  test('.isKey', () => {
    const val: string = 'email';
    if (tspo.isKey(User, val)) {
      val;
    }
    expect(tspo.isKey(User, val)).toStrictEqual(true);
  });

  test('.isValue', () => {
    const val: string = 'joe';
    if (tspo.isValue(User, val)) {
      val;
    }
    expect(tspo.isValue(User, val)).toStrictEqual(true);
  });
});

// -- Collections -- //

describe('Collections', () => {
  test('.keys', () => {
    const keys = tspo.keys(User);
    expect(keys).toStrictEqual(['id', 'name', 'email']);
  });

  test('.values', () => {
    const values = tspo.values(User);
    expect(values).toStrictEqual([1, 'joe', 'joe@gmail.com']);
  });

  test('.entries', () => {
    const entries = tspo.entries(User);
    expect(entries).toStrictEqual([
      ['id', 1],
      ['name', 'joe'],
      ['email', 'joe@gmail.com'],
    ]);
  });

  test('.firstEntry', () => {
    const entries = tspo.firstEntry({ id: 1 });
    expect(entries).toStrictEqual(['id', 1]);
  });

  test('.firstEntry with union object type', () => {
    type Union = { id: number } | { name: string };
    const obj: Union = { id: 1 };
    const entry = tspo.firstEntry(obj);
    const typed: ['id', number] | ['name', string] = entry;
    expect(typed).toStrictEqual(['id', 1]);

    const getEntries = (oneEntry: Union) => {
      const entry = tspo.firstEntry(oneEntry);
      return entry;
    };
  });
});

// -- Utilities -- //

const UserFull = {
  id: 1,
  birthdate: new Date(),
  address: {
    // `address` -> deep-cloned
    street: '123 fake st',
    city: 'seattle',
    country: {
      name: 'USA',
      code: 1,
    },
  },
  jobHistory: [
    'janitor',
    {
      company: 'Lowes',
      role: 'sales associate',
      otherRoles: new Set(['fork-lift driver', 'cashier']),
    },
  ],
  sayHello: () => console.log('hello'),
} as const;

describe('Utilities', () => {
  test('.copy', () => {
    const userFullCopy = tspo.copy(UserFull);
    expect(userFullCopy).toStrictEqual(UserFull);
    expect(userFullCopy.address).not.toBe(UserFull.address);
    expect(userFullCopy.jobHistory).not.toBe(UserFull.jobHistory);
    expect(userFullCopy.jobHistory[1]).not.toBe(UserFull.jobHistory[1]);
    const setTest = setsAreEqual(
      userFullCopy.jobHistory[1].otherRoles,
      UserFull.jobHistory[1].otherRoles,
    );
    expect(setTest).toBeTruthy();
  });

  test('.copy with resetDates', () => {
    const before = Date.now();
    const userFullCopy = tspo.copy(UserFull, { resetDates: true });
    const after = Date.now();
    expect(userFullCopy.birthdate).not.toBe(UserFull.birthdate);
    expect(userFullCopy.birthdate.getTime()).toBeGreaterThanOrEqual(before);
    expect(userFullCopy.birthdate.getTime()).toBeLessThanOrEqual(after);
  });

  test('.iterate', () => {
    const entries: Array<{ key: string | number; value: unknown }> = [];

    tspo.iterate(UserFull, ({ key, value }) => {
      entries.push({ key, value });
    });

    expect(entries).toStrictEqual([
      { key: 'id', value: 1 },
      { key: 'birthdate', value: UserFull.birthdate },
      { key: 'address', value: UserFull.address },
      { key: 'street', value: '123 fake st' },
      { key: 'city', value: 'seattle' },
      { key: 'country', value: UserFull.address.country },
      { key: 'name', value: 'USA' },
      { key: 'code', value: 1 },
      { key: 'jobHistory', value: UserFull.jobHistory },
      { key: 0, value: 'janitor' },
      { key: 1, value: UserFull.jobHistory[1] },
      { key: 'company', value: 'Lowes' },
      { key: 'role', value: 'sales associate' },
      { key: 'otherRoles', value: UserFull.jobHistory[1].otherRoles },
      { key: 'sayHello', value: UserFull.sayHello },
    ]);
  });

  test('.compare', () => {
    const roles = new Set(['fork-lift driver', 'cashier']);
    const a = {
      id: 1,
      birthdate: new Date('2024-01-01T00:00:00.000Z'),
      address: { city: 'seattle' },
      roles,
    };
    const b = {
      id: 1,
      birthdate: new Date('2024-01-01T00:00:00.000Z'),
      address: { city: 'seattle' },
      roles,
    };
    const c = {
      id: 1,
      birthdate: new Date('2024-01-01T00:00:00.000Z'),
      address: { city: 'seattle' },
      roles: new Set(['fork-lift driver', 'cashier']),
    };
    expect(tspo.compare(a, b)).toBe(true);
    expect(tspo.compare(a, c)).toBe(false);
  });
});

/**
 * Test sets for content (not reference equality)
 */
function setsAreEqual(setA: Set<string>, setB: Set<string>) {
  if (setA.size !== setB.size) return false;
  for (let value of setA) {
    if (!setB.has(value)) return false;
  }
  return true;
}
