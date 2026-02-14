import type { PlainObject } from './helpers/isPlainObject.js';
import type {
  KeysParam,
  KeyUnion,
  SetToNever,
} from './helpers/utility-types.js';
import tspo from './tspo.js';

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
type AddEntry = <T extends PlainObject, K extends string, V>(
  obj: T,
  entry: [K, V],
) => asserts obj is CollapseType<T & Record<K, V>>;

// 'asserts' requires explicity type-definition
type Remove = <T extends PlainObject, K extends KeysParam<T>>(
  obj: T,
  keys: K,
) => asserts obj is CollapseType<SetToNever<T, KeyUnion<T, K>>>;

/******************************************************************************
                                  Constants                                  
******************************************************************************/

const typedTspo: Readonly<typeof tspo> & {
  readonly append: Append;
  readonly addEntry: AddEntry;
  readonly remove: Remove;
} = tspo;

/******************************************************************************
                                   Export                                  
******************************************************************************/

export { type OmitNever } from './helpers/utility-types.js';
export default typedTspo;
