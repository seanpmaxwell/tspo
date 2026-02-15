import isPlainObject from '../helpers/isPlainObject.js';
import type { Dict, TruthyObject } from '../helpers/utility-types.js';

/******************************************************************************
                                  Constants
******************************************************************************/

const hop = Object.prototype.hasOwnProperty;

/******************************************************************************
                                  Functions
******************************************************************************/

/**
 * Recursively compares two plain objects.
 *
 * Traversal rules:
 * - recurse into plain objects
 * - recurse into arrays
 * - compare Date by epoch (`getTime()`)
 * - compare any other object values by reference
 */
function compare(a: TruthyObject, b: TruthyObject): boolean {
  if (!isPlainObject(a) || !isPlainObject(b)) {
    throw new Error('compare only works for plain-objects');
  }
  return comparePlainObjects(a, b);
}

/**
 * @private
 *
 * Compare plain-objects.
 */
function comparePlainObjects(a: TruthyObject, b: TruthyObject): boolean {
  let aSize = 0;
  for (const key in a) {
    if (!hop.call(a, key)) continue;
    aSize++;
    if (!hop.call(b, key)) return false;
    if (!compareValue((a as Dict)[key], (b as Dict)[key])) return false;
  }
  let bSize = 0;
  for (const key in b) {
    if (hop.call(b, key)) bSize++;
  }
  return aSize === bSize;
}

/**
 * @private
 *
 * Compare values
 */
function compareValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  // Compare Dates
  if (a instanceof Date || b instanceof Date) {
    return (
      a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
    );
  }
  // Compare Arrays
  const aIsArray = Array.isArray(a),
    bIsArray = Array.isArray(b);
  if (aIsArray || bIsArray) {
    return aIsArray && bIsArray && compareArrays(a, b);
  }
  // Compare plain-objects
  const aIsPlainObject = isPlainObject(a),
    bIsPlainObject = isPlainObject(b);
  if (aIsPlainObject || bIsPlainObject) {
    return aIsPlainObject && bIsPlainObject && comparePlainObjects(a, b);
  }
  // Compare nested objects not plain-object/array/Date
  if (
    typeof a === 'object' &&
    a !== null &&
    typeof b === 'object' &&
    b !== null
  ) {
    return a === b;
  }
  // Default
  return false;
}

/**
 * @private
 *
 * Compare arrays
 */
function compareArrays(a: readonly unknown[], b: readonly unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!compareValue(a[i], b[i])) return false;
  }
  return true;
}

/******************************************************************************
                                    Export
******************************************************************************/

export default compare;
