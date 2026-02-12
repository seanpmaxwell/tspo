import isPlainObject, { POJO } from './isPlainObject.js';

/******************************************************************************
                                     Types                                    
******************************************************************************/

type Path = readonly (string | number)[];

// Callback for the iterate function
type IterateCb = (args: {
  parent: POJO;
  key: string;
  value: unknown;
  path: Path; // path to the parent object
}) => void;

/******************************************************************************
                                  Functions                                    
******************************************************************************/

/**
 * Recursively walks only "plain objects" (as defined by isPlainObject),
 * and calls `onNonPlain` for every key whose value is NOT a plain object.
 *
 * - Descends into a value only if isPlainObject(value) === true.
 * - Fires callback for *every* non-plain value encountered as a property value.
 */
function iterate(root: unknown, cb: IterateCb): void {
  if (!isPlainObject(root)) return;
  interateHelper(root, [], cb);
}

/**
 * @private
 * @see iterate
 */
function interateHelper(
  node: POJO,
  path: (string | number)[],
  cb: IterateCb,
): void {
  for (const [key, value] of Object.entries(node)) {
    if (isPlainObject(value)) {
      interateHelper(value, [...path, key], cb);
    } else {
      cb({ parent: node, key, value, path });
    }
  }
}

/******************************************************************************
                                   Export                                      
******************************************************************************/

export default iterate;
