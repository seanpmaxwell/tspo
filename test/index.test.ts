import { expect, test } from 'vitest';

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

//   omit,
//   pick,
//   merge,
//   append,
//   appendOne,
//   index,
//   remove,
//   safeIndex,
//   reverseIndex,
//   safeReverseIndex,
//   isKey,
//   isValue,
//   keys,
//   values,
//   entries,
//   firstEntry,
//   fill,
//   iterate,
//   copy,

test('.is', () => {
  expect(pojo.is(User)).toStrictEqual(true);
  expect(pojo.is([])).toStrictEqual(false);
});

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

test('.append', () => {
  const user: IUser = { ...User },
    dog: IDog = { ...Dog };
  pojo.append(user, dog);
  expect(user).toStrictEqual({ ...User, ...Dog });
});

// test('appendOne', () => {
//   const user: IUser = { ...User };
//   pojo.appendOne(user, ['address', 'cherry']);
//   user;
// });

// test('remove', () => {
//   const user = { ...User };
//   pojo.remove(user, ['email']);
//   user;
//   type tuser = OmitRemoved<typeof user>;
//   console.log(user.email);
// });

// test('isKey', () => {
//   const val: string = 'email';
//   if (pojo.isKey(User, val)) {
//     val;
//   }
// });

// test('isValue', () => {
//   const val: string = 'email';
//   if (pojo.isValue(User, val)) {
//     val;
//   }
// });

// test('keys', () => {
//   const keys = pojo.keys(User);
// });

// test('entries', () => {
//   const entries = pojo.entries(User);
// });

// test('firstEntry', () => {
//   const entry = pojo.firstEntry({ id: 1 });
// });

// After the other testing is finished
// look at the readme file and the src/index.ts file and generate for me a
// list of human readable unit-tests in vitest which thoroughly cover all the edge cases in the file `ai.test.ts`
