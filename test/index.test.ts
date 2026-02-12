import { describe, expect, test } from 'vitest';

import pojo, { type OmitNever } from '../src';

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
  id: 1,
  name: 'fido',
  age: 11,
} as const satisfies IDog;

/******************************************************************************
                                Test
******************************************************************************/

describe('Returning new object', () => {
  test('.omit', () => {
    const omit1 = pojo.omit(User, 'id');
    expect(omit1).toStrictEqual({ name: User.name, email: User.email });
    const omit2 = pojo.omit(User, ['id', 'name']);
    expect(omit2).toStrictEqual({ email: User.email });
  });

  test('.pick', () => {
    const pick1 = pojo.pick(User, 'id');
    expect(pick1).toStrictEqual({ id: User.id });
    const pick2 = pojo.pick(User, ['id', 'name']);
    expect(pick2).toStrictEqual({ id: User.id, name: User.name });
  });

  test('.merge', () => {
    const userDog = pojo.merge(User, Dog);
    expect(userDog).toStrictEqual({ ...User, ...Dog });
  });

  test('.fill', () => {
    const userDog = pojo.fill(User, { id: 2 });
    expect(userDog).toStrictEqual({ ...User, id: 2 });
  });
});

describe('Mutating', () => {
  test('.append', () => {
    const user: IUser = { ...User },
      dog: IDog = { ...Dog };
    pojo.append(user, dog);
    expect(user).toStrictEqual({ ...User, ...Dog });
  });

  test('.appendOne', () => {
    const user: IUser = { ...User };
    pojo.appendOne(user, ['address', '123 fake st']);
    expect(user).toStrictEqual({ ...User, address: '123 fake st' });
  });

  test('.remove', () => {
    const user = { ...User };
    pojo.remove(user, ['id', 'email']);
    user;
    type tuser = OmitNever<typeof user>;
    expect(user).toStrictEqual({ name: User.name });
    const user2 = { ...User };
    pojo.remove(user2, 'email');
    type tuser2 = OmitNever<typeof user2>;
    expect(user2).toStrictEqual({ id: User.id, name: User.name });
  });
});

// -- Indexing -- //

describe('Indexing', () => {
  test('.index', () => {
    const val1 = pojo.index(User, 'id');
    expect(val1).toStrictEqual(1);
    const val2 = pojo.index(User, 'idd');
    expect(val2).toStrictEqual(undefined);
  });

  test('.safeIndex', () => {
    const val1 = pojo.safeIndex(User, 'id');
    expect(val1).toStrictEqual(1);
    const getVal = () => pojo.safeIndex(User, 'idd');
    expect(() => getVal()).toThrowError();
  });

  test('.reverseIndex', () => {
    const key1 = pojo.reverseIndex(User, 1);
    expect(key1).toStrictEqual(['id']);
    const key2 = pojo.reverseIndex(User, 2);
    expect(key2).toStrictEqual([]);
  });

  test('.safeReverseIndex', () => {
    const key1 = pojo.safeReverseIndex(User, 1);
    expect(key1).toStrictEqual('id');
    const getVal = () => pojo.safeReverseIndex(User, 2);
    expect(() => getVal()).toThrowError();
  });
});

// -- Validator-functions -- //

describe('Validator-functions', () => {
  test('.is', () => {
    expect(pojo.is(User)).toStrictEqual(true);
    expect(pojo.is([])).toStrictEqual(false);
  });

  test('.isKey', () => {
    const val: string = 'email';
    if (pojo.isKey(User, val)) {
      val;
    }
    expect(pojo.isKey(User, val)).toStrictEqual(true);
  });

  test('.isValue', () => {
    const val: string = 'joe';
    if (pojo.isValue(User, val)) {
      val;
    }
    expect(pojo.isValue(User, val)).toStrictEqual(true);
  });
});

// -- Collections -- //

describe('Collections', () => {
  test('.keys', () => {
    const keys = pojo.keys(User);
    expect(keys).toStrictEqual(['id', 'name', 'email']);
  });

  test('.values', () => {
    const values = pojo.values(User);
    expect(values).toStrictEqual([1, 'joe', 'joe@gmail.com']);
  });

  test('.entries', () => {
    const entries = pojo.entries(User);
    expect(entries).toStrictEqual([
      ['id', 1],
      ['name', 'joe'],
      ['email', 'joe@gmail.com'],
    ]);
  });

  test('.firstEntry', () => {
    const entries = pojo.firstEntry({ id: 1 });
    expect(entries).toStrictEqual(['id', 1]);
  });
});

// -- Utilities -- //

describe('Utilities', () => {
  describe('.copy', () => {
    // pick up here
  });
});
