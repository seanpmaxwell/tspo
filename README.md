# jet-pojo ✈️

[![npm](https://img.shields.io/npm/v/jet-pojo?label=npm&color=0ea5e9)](https://www.npmjs.com/package/jet-pojo)
[![downloads](https://img.shields.io/npm/dm/jet-pojo?label=downloads&color=38bdf8)](https://www.npmjs.com/package/jet-pojo)
[![types](https://img.shields.io/npm/types/jet-pojo?label=types&color=22c55e)](https://www.npmjs.com/package/jet-pojo)
[![bundle size](https://img.shields.io/bundlephobia/minzip/jet-pojo?label=bundle&color=0f172a)](https://bundlephobia.com/package/jet-pojo)
[![license](https://img.shields.io/npm/l/jet-pojo?label=license&color=334155)](LICENSE)

> `jet-pojo` is a TypeScript-first utility library for working with plain JavaScript objects while keeping runtime behavior and static types aligned.

## 🤔 What a POJO?

A _plain-old-javascript-object (POJO or pojo)_ is any object which inherits directly from the base `Object` class and no other or is created through `Object.create(null)`.

3 ways to implement:

- **object-literals:** (most-common), i.e `{ id: 1, name: 'john' }`
- **Object constructor:**: `var user = new Object()`
- **null-prototype objects:** `var user = Object.create(null)`

> _object-literals_ and _instances of Object_ will inherit from the base _Object_ class; hence, they can use methods like `.hasOwnProperty`. _null-prototype objects_ inherit from nothing so cannot use these functions.

## ❓Why jet-pojo?

- Small, zero-dependency utility set centered around plain-object workflows.
- Runtime AND type-level guarantees in the same API surface.
- Practical mutating helpers (`.append`, `.appendOne`, `.remove`) with assertion-based type refinement.
- All complex-types collapsed for better IntelliSense.

## 📦 Installation

```bash
npm install jet-pojo
```

```bash
pnpm add jet-pojo
```

```bash
yarn add jet-pojo
```

## ⚡ Quick start

```ts
import pojo, { OmitRemoved } from 'jet-pojo';

const user = {
  id: 1,
  name: 'Ada',
  email: 'ada@e.com',
} as const;

// Non-mutating functions
const omitted = pojo.omit(user, 'email');
// omitted -> { id: 1, name: "Ada" }
const picked = pojo.pick(user, 'name');
// picked -> { name: "Ada" }
const merged = pojo.merge({ id: 1 }, { name: 'Ada' });
// merged -> { id: 1, name: "Ada" }

// Mutating functions
const dog = { id: 1 };
pojo.append(dog, { name: 'fido' });
// dog -> { id: 1, name: fido }
pojo.remove(dog, 'name');
// dog -> { id: 1, name: never }

// Accessors
const role = pojo.safeIndex(user, 'someString');
// role -> 'id' | 'name' | 'email'
```

## 📚 API Summary

Use this as a quick decision guide:

### Object builders

| Function | Notes                                     |
| -------- | ----------------------------------------- |
| `omit`   | Returns object without selected keys      |
| `pick`   | Returns object with selected keys         |
| `merge`  | Returns `{...a, ...b}`                    |
| `fill`   | Combines defaults with a partial override |

### Object modifiers

| Function    | Notes                                       |
| ----------- | ------------------------------------------- |
| `append`    | Adds keys from `addOn` to `obj`             |
| `appendOne` | Adds one `[key, value]` entry               |
| `remove`    | Deletes keys and refines deletes to `never` |

### Indexing

| Function           | Notes                                           |
| ------------------ | ----------------------------------------------- |
| `index`            | Dynamic lookup, returns `undefined` when absent |
| `safeIndex`        | Lookup that throws on missing key               |
| `reverseIndex`     | Returns all matching keys for a value           |
| `safeReverseIndex` | Returns exactly one key or throws               |

### Validator functions

| Function  | Notes                         |
| --------- | ----------------------------- |
| `is`      | Runtime POJO guard            |
| `isKey`   | Type guard for existing key   |
| `isValue` | Type guard for existing value |

### Collections

| Function     | Notes                                   |
| ------------ | --------------------------------------- |
| `keys`       | Typed `Object.keys` tuple               |
| `values`     | Typed `Object.values` tuple             |
| `entries`    | Typed `Object.entries` tuple            |
| `firstEntry` | First entry in object enumeration order |

### Utilities

| Function  | Notes                              |
| --------- | ---------------------------------- |
| `iterate` | Recursive walker over nested POJOs |
| `copy`    | Deep clone utility                 |
| `compare` | Deep compare utility               |

## 📖 API reference

### Object builders

#### `.omit(T: object, K: keyof T | Array<keyof T>): Omit<T, K>`

Returns a new object excluding one key or an array of keys.

```ts
const redacted = pojo.omit({ a: 'a', b: 1, c: false }, ['b', 'c']);
// Value: { a: 'a' }
// Type:  { a: string; }
```

#### `.pick(T: object, K: keyof T | Array<keyof T>): Pick<T, K>`

Returns a new object containing only one key or an array of keys.

```ts
const preview = pojo.pick({ a: 'a', b: 1, c: false }, ['a', 'c']);
// Value: { a: 'a', c: false }
// Type:  { a: string; c: boolean }
```

#### `.merge(T: object, U: object): T & U`

Returns a new object from `{ ...a, ...b }` with merged typing.

```ts
const full = pojo.merge({ id: 1 }, { active: true });
// Value: { id: 1; active: true }
// Type:  { id: number; active: boolean }
```

#### `.fill(T: object, partial?: Partial<T>): T`

Returns a full object `T`, using the first argument as the default, and appending supplied values from an optional partial (second argument).

```ts
const config = pojo.fill({ retries: 3, timeoutMs: 5000 }, { timeoutMs: 8000 });
// Value: { retries: 3000, timeoutMs: 8000 }
// Type:  { retries: number; timeoutMs: number }
```

### Object modifiers

- Functions which modify the provided object will mutate its type and value.
- **DO NOT** set a return value from mutation functions or type-updating will not work.

#### `.append(T: object, U: object): void`

Mutates `T` by copying enumerable keys from `U`. TypeScript narrows `T` to `T & U` after the call.

```ts
const draft = { id: 1 };
pojo.append(draft, { name: 'Ada' });
// Value: { id: 1, name: 'Ada' }
// Type:  { id: number; name: string }
```

#### `.appendOne(T: object, entry: [key, value]): void`

Mutates `T` by adding a single entry. TypeScript narrows `T` to `T & { key: value }`.

```ts
const draft = { id: 1 };
pojo.appendOne(draft, ['team', 'platform']);
// Value: { id: 1, team: 'platform' }
// Type:  { id: number; team: string }
```

#### `.remove(T: object, K: keyof T | Array<keyof T>): void`

Mutates `T` and deletes one or more keys.  
Because of TypeScript limitiations, we cannot remove keys in place on `T` so we set them to `never`.
If you want to clean the type after removing, use `OmitNever<T>`

```ts
const draft = { id: 1, email: 'ada@example.com' };
pojo.remove(draft, 'email');
type Clean = OmitNever<typeof draft>; // strips `never` keys
// Value: { id: 1 }
// Type `draft`: { id: number; email: never }
// Type `Clean`: { id: number }
```

### Indexing

These are useful when your key or value is coming from a dynamic source.

#### `.index(T: object, key: string | number): keyof T | undefined`

Dynamic key lookup that returns `undefined` when missing.

```ts
const value = pojo.index({ a: 'a', b: 1 }, 'a');
// Value: "a"
// Type: => 'a' | 1 | undefined
```

#### `.safeIndex(T: object, key: string | number): keyof T`

Dynamic key lookup that _throws_ if the key does not exist.

```ts
const value = pojo.safeIndex({ a: 'a', b: 1 }, 'a');
// Value: "a"
// Type:  'a' | 1
```

#### `.reverseIndex(T: object, value: unknown): Array<T[keyof T]>`

Returns all keys whose value is strictly equal (`===`) to `value`.

```ts
const keys = pojo.reverseIndex({ a: 1, b: 2, c: 1 }, 1);
// Value: ["a", "c"]
// Type (Tuple-type): ['a', 'b', 'c']
```

#### `.safeReverseIndex(T: object, value: unknown): T[keyof T]`

Returns exactly one matching key for `value`. Throws if zero or multiple keys match.

```ts
const key = pojo.safeReverseIndex({ a: 1, b: 2 }, 2);
// Value: "b"
// Type: 'a' | 'b'
```

### Validator functions

#### `.is(arg: unknown): arg is PlainObject (NonNullable<object>)`

Validator-function for POJOs.

```ts
pojo.is({ a: 1 }); // true
pojo.is(Object.create(null)); // true
pojo.is([]); // false
pojo.is(new Date()); // false
```

#### `.isKey(T: object, arg: string): arg is keyof T`

Runtime key existence check and TypeScript key guard.

```ts
const candidate: string = 'email';
if (pojo.isKey(user, candidate)) {
  // candidate is narrowed to `keyof typeof user`
}
```

#### `.isValue(T: object, arg: unknown): arg is T[keyof T]`

Runtime value existence check and TypeScript value guard.

```ts
const candidate: unknown = 'admin';
if (pojo.isValue(user, candidate)) {
  // candidate is narrowed to `typeof user[keyof typeof user]`
}
```

### Collections

#### `.keys(T: object): Tuple of keyof T`

Typed `Object.keys`. Tuple order not guaranteed.

```ts
const keys = pojo.keys({ a: 1, b: 2, c: 1 });
// Value: ["a", "b", "c"]
// Type (Tuple-type): ['a', 'b', 'c']
```

#### `.values(T: object): Tuple of T[keyof T]`

Typed `Object.values()`. Tuple order not guaranteed.

```ts
const allValues = pojo.values({ a: 1, b: 2, c: 1 });
// Value: [1, 2, 3]
// Type (Tuple-type): [1, 2, 3]
```

#### `.entries(T: unknown): Tuple of [keyof T, T[keyof T]]`

Typed `Object.entries`. Tuple order not guaranteed.

```ts
const allEntries = pojo.entries(user);
// Value: [["a", 1], ["b", 2], ["c", 3]]
// Type (Tuple-type): [['a', 1], ['b', 2], ['c', 3]]
```

#### `.firstEntry(arg: object): [keyof T, T[keyof T]]`

Returns the first entry by object enumeration order.
This is useful for when you know your object only has one entry and but you don't know the `key` value.

```ts
const [key, value] = pojo.firstEntry({ id: 1, name: 'Ada' });
// Value: ["id", 1]
// Type: ["id", number]
```

### Utilities

#### `.iterate(root: object | array, cb: IterateCb): void`

Recursively iterates a plain-object (and any nested plain-objects/arrays) and fires a callback for every key that is neither a plain-object/array.

`IterateCb: (arg: ArgumentObject) => void`:

`ArgumentObject`:

- `parent (PlainObject | Array)`: object or array containing the current leaf
- `key (string | number)`: key/index on `parent`
- `value (unknown)`: entry value
- `path (Array<string | number>)`: path to `parent` from root

```ts
pojo.iterate(
  {
    user: { id: 1, name: 'Ada' }, // `user` will be entered
    flags: ['staff'], // `flags` will be entered
    foo: new Set(), // `foo` will not be entered and fire a callback
  },
  ({ key, value, path }) => {
    // fires for:
    // user.id   -> path: ['user']
    // user.name -> path: ['user']
    // flags[0]  -> path: ['flags']
    // foo       -> path: []
    console.log(path, key, value);
  },
);
```

#### `.copy(T: PlainObject): T`

Copies a plain-object root value. Recursion only steps into nested plain-objects and arrays. Nested `Date` values are copied by epoch, and other nested objects (i.e. `Set/Map`) are _shallow-cloned_. This is much faster than `structuredClone`, so is recommended when you don't need deep-cloning for anything other than plain-objects/arrays.

```ts
const snapshot = pojo.copy({
  id: 1,
  birthdate: new Date(), // `birthdate` -> new Date() of same epoch
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
    // `jobHistory` -> deep-cloned
    'janitor',
    {
      company: 'Lowes',
      role: 'sales associate',
      otherRoles: new Set(['fork-lift driver', 'cashier']), // -> `otherRoles` shallow-cloned
    },
  ],
});
```

#### `.compare(T: object, U: object): boolean`

Recursively compares 2 plain-objects but only arrays and plain-objects will be stepped into. `Date` objects will be compared by the epoch and all other nested objects will be compared by reference. In other words, this isn't recommended if you have nested objects other than plain-objects, arrays, or Dates.

```ts
const currentDate = new Date();
const jobs = new Set(['janitor']);
const jobs2 = new Set(['janitor']);

const user = {
  id: 1,
  name: 'joe',
  birthdate: currentDate,
  jobs: jobs,
};

const user2 = {
  id: 1,
  name: 'joe',
  birthdate: currentDate,
  jobs: jobs,
};

const user3 = {
  id: 1,
  name: 'joe',
  birthdate: currentDate,
  jobs: jobs2,
};

pojo.compare(user, user2); // true;
pojo.compare(user, user3); // false;
```

## 📄 License

MIT © [seanpmaxwell1](LICENSE)
