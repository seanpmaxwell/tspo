import { POJO } from './isPlainObject.js';
import pojo from './jet-pojo.js';
import { KeysParam, KeyUnion, SetToNever } from './utility-types.js';

/******************************************************************************
                                   Types                                  
******************************************************************************/

// Must be defined in the file it is used in
// type CollapseType<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type CollapseTypeAlt<T> = {
  [K in keyof T]: T[K];
} & {};

// 'asserts' requires explicity type-definition
type Append = <T extends POJO, U extends POJO>(
  obj: T,
  addOn: U,
) => asserts obj is CollapseTypeAlt<T & U>;

type AppendOne = <T extends POJO, K extends string, V>(
  obj: T,
  entry: [K, V],
) => asserts obj is CollapseTypeAlt<T & Record<K, V>>;

type Remove = <T extends POJO, K extends KeysParam<T>>(
  obj: T,
  keys: K,
) => asserts obj is CollapseTypeAlt<SetToNever<T, KeyUnion<T, K>>>;

/******************************************************************************
                                   Export                                  
******************************************************************************/

const typedPO: Readonly<typeof pojo> & {
  append: Append;
  appendOne: AppendOne;
  remove: Remove;
} = pojo;

export { OmitRemoved } from './utility-types.js';
export default typedPO;
