import isPlainObject, {
  type Dict,
  type PlainObject,
} from '../isPlainObject.js';

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
function compare(a: PlainObject, b: PlainObject): boolean {
  if (!isPlainObject(a) || !isPlainObject(b)) {
    return false;
  }
  return comparePlainObjects(a, b);
}

/**
 * Compare plain-objects.
 */
function comparePlainObjects(a: PlainObject, b: PlainObject): boolean {
  const aKeys = Object.keys(a),
    bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!hop.call(b, key)) return false;
    if (!compareValue((a as Dict)[key], (b as Dict)[key])) return false;
  }
  return true;
}

/**
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
