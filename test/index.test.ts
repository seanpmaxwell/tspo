import { expect, test } from 'vitest';

import pojo, { OmitRemoved } from '../src';

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

test('omit', () => {
  const omit1 = pojo.omit(User, 'id');
  const omit2 = pojo.omit(User, ['id', 'name']);
});

test('pick', () => {
  const pick1 = pojo.pick(User, 'id');
  const pick2 = pojo.pick(User, ['id', 'name']);
});

test('append', () => {
  const user: IUser = { ...User },
    dog: IDog = { ...Dog };
  pojo.append(user, dog);
  user;
});

test('appendOne', () => {
  const user: IUser = { ...User };
  pojo.appendOne(user, ['address', 'cherry']);
  user;
});

test('remove', () => {
  const user = { ...User };
  pojo.remove(user, ['email']);
  user;
  type tuser = OmitRemoved<typeof user>;
  console.log(user.email);
});

test('isKey', () => {
  const val: string = 'email';
  if (pojo.isKey(User, val)) {
    val;
  }
});

test('isValue', () => {
  const val: string = 'email';
  if (pojo.isValue(User, val)) {
    val;
  }
});

test('entries', () => {
  const entries = pojo.entries(User);
});

test('firstEntry', () => {
  const entry = pojo.firstEntry({ id: 1 });
});
