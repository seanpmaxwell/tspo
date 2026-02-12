# jet-pojo

`jet-pojo` is a TypeScript-first utility library for working with plain JavaScript objects while keeping runtime behavior and static types aligned.

It provides a focused set of object helpers (`omit`, `pick`, `merge`, `append`, `remove`, `index`, `iterate`, `copy`, and more) designed for codebases that care about:

- predictable object transforms,
- type-safe mutation workflows,
- and minimal type assertions in application code.

## What counts as a POJO?

To be clear, a **plain-old-javascript-object (pojo)** is any object which inherits directly from the base `Object` class and no other. This is different from objects created with `Object.create(null)` which do not have any inheritance; we'll refer to these as **null-prototype objects (npo)**. **pojos** can be created by calling `new Object()` or more-commonly through object-literals (i.e `{}`). Methods like `.hasOwnProperty` will work on **pojo's** but not **npo's**.

| Name                    | Abbreviation/Acronym | Type                           |
| ----------------------- | -------------------- | ------------------------------ |
| `PlainObject`           | `pojo`               | `NonNullable<object>`          |
| `Dictonary`             | `Dict`               | `Record<string, unknown>`      |
| `null-prototype object` | `npo`                | `Dict & { __proto__?: never }` |

## Why jet-pojo

- Strong TypeScript inference for both immutable and mutable object updates.
- Runtime helpers and type-level guarantees in the same API surface.
- Practical mutating helpers (`append`, `appendOne`, `remove`) with assertion-based type refinement.
- Small, focused utility set centered around plain-object workflows.

## Installation

```bash
npm install jet-pojo
```

```bash
pnpm add jet-pojo
```

```bash
yarn add jet-pojo
```

## Quick start

```ts
import pojo, { OmitRemoved } from 'jet-pojo';

const user = {
  id: 1,
  name: 'Ada',
  email: 'ada@example.com',
  role: 'admin',
} as const;

// Non-mutating helpers
const publicUser = pojo.omit(user, 'email');
const identity = pojo.pick(user, ['id', 'name']);
const merged = pojo.merge(identity, { active: true });

// Mutating helpers with type assertions
const session = { id: 'sess_1' };
pojo.append(session, { userId: user.id, authenticated: true });
pojo.appendOne(session, ['ip', '127.0.0.1']);
pojo.remove(session, 'ip');

// remove() sets removed keys to `never` in the type:
type SessionWithoutRemoved = OmitRemoved<typeof session>;

// Safe access helpers
const role = pojo.safeIndex(user, 'role'); // throws if key is missing
```

## Mutation model

Use this as a quick decision guide:

| Function           | Mutates input | Notes                                           |
| ------------------ | ------------- | ----------------------------------------------- |
| `is`               | No            | Runtime POJO guard                              |
| `omit`             | No            | Returns object without selected keys            |
| `pick`             | No            | Returns object with selected keys               |
| `merge`            | No            | Returns `{...a, ...b}`                          |
| `append`           | Yes           | Adds keys from `addOn` to `obj`                 |
| `appendOne`        | Yes           | Adds one `[key, value]` entry                   |
| `remove`           | Yes           | Deletes keys and refines type to `never`        |
| `index`            | No            | Dynamic lookup, returns `undefined` when absent |
| `safeIndex`        | No            | Lookup that throws on missing key               |
| `reverseIndex`     | No            | Returns all matching keys for a value           |
| `safeReverseIndex` | No            | Returns exactly one key or throws               |
| `fill`             | No            | Combines defaults with a partial override       |
| `isKey`            | No            | Type guard for existing key                     |
| `isValue`          | No            | Type guard for existing value                   |
| `keys`             | No            | Typed `Object.keys` tuple                       |
| `values`           | No            | Typed `Object.values` tuple                     |
| `entries`          | No            | Typed `Object.entries` tuple                    |
| `firstEntry`       | No            | First entry in object enumeration order         |
| `iterate`          | No            | Recursive walker over nested POJOs              |
| `clone`            | No            | Deep clone utility                              |

## API reference

### `.is(arg: unknown): arg is PlainObject`

Validator-function for POJOs.

```ts
pojo.is({ a: 1 }); // true
pojo.is(Object.create(null)); // true
pojo.is([]); // false
pojo.is(new Date()); // false
```

### `.omit(T: object, K: keyof T | Array<keyof T>): Omit<T, K>`

Returns a new object excluding one key or an array of keys.

```ts
const redacted = pojo.omit({ a: 'a', b: 1, c: false }, ['b', 'c']);
// Value: { a: 'a' }
// Type:  { a: string; }
```

### `.pick(T: object, K: keyof T | Array<keyof T>): Pick<T, K>`

Returns a new object containing only one key or an array of keys.

```ts
const preview = pojo.pick({ a: 'a', b: 1, c: false }, ['a', 'c']);
// Value: { a: 'a', c: false }
// Type:  { a: string; c: boolean }
```

### `.merge(T: object, U: object): T & U`

Returns a new object from `{ ...a, ...b }` with merged typing.

```ts
const full = pojo.merge({ id: 1 }, { active: true });
// Value: { id: 1; active: true }
// Type:  { id: number; active: boolean }
```

### `.append(T: object, U: object): void`

Mutates `T` by copying enumerable keys from `U`.  
TypeScript narrows `T` to `T & U` after the call.

```ts
const draft = { id: 1 };
pojo.append(draft, { name: 'Ada' });
// Value: { id: 1, name: 'Ada' }
// Type:  { id: number; name: string }
```

### `.appendOne(T: object, entry: [key, value]): void`

Mutates `T` by adding a single entry.  
TypeScript narrows `T` to `T & { key: value }`.

```ts
const draft = { id: 1 };
pojo.appendOne(draft, ['team', 'platform']);
// Value: { id: 1, team: 'platform' }
// Type:  { id: number; team: string }
```

### `.remove(T: object, K: keyof T | Array<keyof T>): void`

Mutates `obj` and deletes one or more keys.  
Because of TypeScript limitiations, we cannot remove keys in place so we set them to `never`.
If you want to clean the type after removing, use `OmitRemoved<T>`

```ts
const draft = { id: 1, email: 'ada@example.com' };
pojo.remove(draft, 'email');
type Clean = OmitRemoved<typeof draft>; // strips `never` keys
// Value: { id: 1 }
// Type `draft`: { id: number; email: never }
// Type `Clean`: { id: number }
```

### `.index(T: object, key: string): keyof T | undefined`

Dynamic key lookup that returns `undefined` when missing.

```ts
const value = pojo.index({ a: 'a', b: 1 }, 'a');
// Value: "a"
// Type: => 'a' | 1 | undefined
```

### `.safeIndex(T: object, key: string): keyof T`

Dynamic key lookup that _throws_ if the key does not exist.

```ts
const value = pojo.safeIndex({ a: 'a', b: 1 }, 'a');
// Value: "a"
// Type:  'a' | 1
```

### `.reverseIndex(T: object, value: unknown): Array<T[keyof T]>`

Returns all keys whose value is strictly equal (`===`) to `value`.

```ts
const keys = pojo.reverseIndex({ a: 1, b: 2, c: 1 }, 1);
// Value: ["a", "c"]
// Type (Tuple-type): ['a', 'b', 'c']
```

### `.safeReverseIndex(T: object, value: unknown): T[keyof T]`

Returns exactly one matching key for `value`.  
Throws if zero or multiple keys match.

```ts
const key = pojo.safeReverseIndex({ a: 1, b: 2 }, 2);
// Value: "b"
// Type: 'a' | 'b'
```

### `.fill(T: object, partial?: Partial<T>): T`

Returns a full object `T`, using the first argument as the default, and appending supplied values from an optional partial (second argument).

```ts
const config = pojo.fill({ retries: 3, timeoutMs: 5000 }, { timeoutMs: 8000 });
// Value: { retries: 3000, timeoutMs: 8000 }
// Type:  { retries: number; timeoutMs: number }
```

### `.isKey(T: object, arg: string): arg is keyof T`

Runtime key existence check and TypeScript key guard.

```ts
const candidate: string = 'email';
if (pojo.isKey(user, candidate)) {
  // candidate is narrowed to `keyof typeof user`
}
```

### `.isValue(T: object, arg: unknown): arg is T[keyof T]`

Runtime value existence check and TypeScript value guard.

```ts
const candidate: unknown = 'admin';
if (pojo.isValue(user, candidate)) {
  // candidate is narrowed to `typeof user[keyof typeof user]`
}
```

### `.keys(T: object): Tuple of keyof T`

Typed `Object.keys`. Tuple order not guaranteed.

```ts
const keys = pojo.keys({ a: 1, b: 2, c: 1 });
// Value: ["a", "b", "c"]
// Type (Tuple-type): ['a', 'b', 'c']
```

### `.values(T: object): Tuple of T[keyof T]`

Typed `Object.values()`. Tuple order not guaranteed.

```ts
const allValues = pojo.values({ a: 1, b: 2, c: 1 });
// Value: [1, 2, 3]
// Type (Tuple-type): [1, 2, 3]
```

### `.entries(T: unknown): Tuple of [keyof T, T[keyof T]]`

Typed `Object.entries`. Tuple order not guaranteed.

```ts
const allEntries = pojo.entries(user);
// Value: [["a", 1], ["b", 2], ["c", 3]]
// Type (Tuple-type): [['a', 1], ['b', 2], ['c', 3]]
```

### `.firstEntry(arg: object): [keyof T, T[keyof T]]`

Returns the first entry by object enumeration order.
This is useful for when you know your object only has one entry and but you don't know the `key` value.

```ts
const [key, value] = pojo.firstEntry({ id: 1, name: 'Ada' });
// Value: ["id", 1]
// Type: ["id", number]
```

### `.iterate(root: object, cb: (argument) => void): void`

Recursively walks nested POJOs and calls `callback` for every non-POJO leaf value.

Callback arguments:

- `parent`: object containing the current leaf
- `key`: key on `parent`
- `value`: leaf value
- `path`: path to `parent` from root

```ts
pojo.iterate(
  {
    user: { id: 1, name: 'Ada' },
    flags: ['staff'],
  },
  ({ key, value, path }) => {
    // fires for:
    // user.id   -> path: ['user']
    // user.name -> path: ['user']
    // flags     -> path: []
    console.log(path, key, value);
  },
);
```

### `.clone(value)`

Deep clone helper intended for acyclic data structures.

Current behavior includes cloning support for:

- primitives (returned as-is),
- arrays,
- plain objects (including null-prototype),
- `Date`,
- `RegExp` (including `lastIndex`),
- `Map`,
- `Set`,
- `ArrayBuffer`, typed arrays, and `DataView`,
- generic objects (prototype preserved; enumerable own props copied).

```ts
const snapshot = pojo.clone(state);
```

## Exported types

### `OmitRemoved<T>`

Utility type exported from package root.  
Useful after calling `pojo.remove`, where removed keys become `never`.

```ts
import pojo, { OmitRemoved } from 'jet-pojo';

const data = { id: 1, secret: 'x' };
pojo.remove(data, 'secret');

type PublicData = OmitRemoved<typeof data>; // { id: number }
```

## Notes

- `safeIndex` and `safeReverseIndex` throw runtime errors on invalid assumptions.
- Matching in `reverseIndex` and `safeReverseIndex` uses strict equality (`===`).
- `firstEntry` assumes a non-empty object at runtime.
- `clone` does not include circular reference handling.
