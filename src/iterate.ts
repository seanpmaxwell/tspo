import isPlainObject, { type PlainObject } from './isPlainObject.js';

/******************************************************************************
                                     Types                                    
******************************************************************************/

type Path = readonly (string | number)[];
type IterateParent = PlainObject | unknown[];
type IterateKey = string | number;

// Callback for the iterate function
type IterateCb = (args: {
  parent: IterateParent;
  key: IterateKey;
  value: unknown;
  path: Path; // path to the parent node
}) => void;

/******************************************************************************
                                  Functions                                    
******************************************************************************/

/**
 * Recursively walks plain-objects and arrays, and calls a callback for
 * every key whose value is neither a plain-object nor an array.
 *
 * - Descends into a value if it is a plain-object or array.
 * - Fires callback for every non-descended value.
 */
function iterate(root: unknown, cb: IterateCb): void {
  if (!isPlainObject(root)) return;
  iterateHelper(root, [], cb);
}

/**
 * @private
 * @see iterate
 */
function iterateHelper(
  node: IterateParent,
  path: (string | number)[],
  cb: IterateCb,
): void {
  // Walk array
  if (Array.isArray(node)) {
    let i = 0;
    for (const [key, value] of node.entries()) {
      if (isPlainObject(value) || Array.isArray(value)) {
        iterateHelper(value, [...path, key, i], cb);
      } else {
        cb({ parent: node, key, value, path });
      }
      i++;
    }
    return;
  }
  // Walk
  for (const [key, value] of Object.entries(node)) {
    if (isPlainObject(value) || Array.isArray(value)) {
      iterateHelper(value, [...path, key], cb);
    } else {
      cb({ parent: node, key, value, path });
    }
  }
}

/******************************************************************************
                                   Export                                      
******************************************************************************/

export default iterate;
