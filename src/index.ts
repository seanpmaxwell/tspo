import { type PlainObject } from './isPlainObject.js';
import pojo from './jet-pojo.js';
import type { KeysParam, KeyUnion, SetToNever } from './utility-types.js';

/******************************************************************************
                                   Types                                  
******************************************************************************/

// Must be defined in the file it is used in
// type CollapseType<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type CollapseType<T> = {
  [K in keyof T]: T[K];
} & {};

// 'asserts' requires explicity type-definition
type Append = <T extends PlainObject, U extends PlainObject>(
  obj: T,
  addOn: U,
) => asserts obj is CollapseType<T & U>;

type AppendOne = <T extends PlainObject, K extends string, V>(
  obj: T,
  entry: [K, V],
) => asserts obj is CollapseType<T & Record<K, V>>;

type Remove = <T extends PlainObject, K extends KeysParam<T>>(
  obj: T,
  keys: K,
) => asserts obj is CollapseType<SetToNever<T, KeyUnion<T, K>>>;

/******************************************************************************
                                   Export                                  
******************************************************************************/

const typedPO: Readonly<typeof pojo> & {
  append: Append;
  appendOne: AppendOne;
  remove: Remove;
} = pojo;

export { type OmitNever } from './utility-types.js';
export default typedPO;
