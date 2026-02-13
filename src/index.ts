import { type Dict, type PlainObject } from './isPlainObject.js';
import pojo from './jet-pojo.js';
import type { KeysParam, KeyUnion, SetToNever } from './utility-types.js';

/******************************************************************************
                                   Types                                  
******************************************************************************/

// Must be defined in the file it is used in
type CollapseType<T> = {
  [K in keyof T]: T[K];
} & {};

// 'asserts' requires explicity type-definition
type Append = <T extends PlainObject, U extends PlainObject>(
  obj: T,
  addOn: U,
) => asserts obj is CollapseType<T & U>;

// 'asserts' requires explicity type-definition
type AppendOne = <T extends PlainObject, K extends string, V>(
  obj: T,
  entry: [K, V],
) => asserts obj is CollapseType<T & Record<K, V>>;

// 'asserts' requires explicity type-definition
type Remove = <T extends PlainObject, K extends KeysParam<T>>(
  obj: T,
  keys: K,
) => asserts obj is CollapseType<SetToNever<T, KeyUnion<T, K>>>;

type ToDict = (obj: unknown) => Dict;

/******************************************************************************
                                  Constants                                  
******************************************************************************/

const typedPojo: Readonly<typeof pojo> & {
  readonly append: Append;
  readonly appendOne: AppendOne;
  readonly remove: Remove;
  readonly toDict: ToDict;
} = pojo;

/******************************************************************************
                                   Export                                  
******************************************************************************/

export { type OmitNever } from './utility-types.js';
export { type Dict } from './isPlainObject.js';
export default typedPojo;
