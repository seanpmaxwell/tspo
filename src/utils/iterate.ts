import type { PlainObject } from 'src/helpers/utility-types.js';

import isPlainObject from '../helpers/isPlainObject.js';

/******************************************************************************
                                     Constants                                   
******************************************************************************/

const hop = Object.prototype.hasOwnProperty;

/******************************************************************************
                                     Types                                    
******************************************************************************/

// Callback for the iterate function
type IterateCb = (args: {
  parent: PlainObject | unknown[];
  key: string | number;
  value: unknown;
  path: readonly (string | number)[]; // path to the parent node
}) => void;

/******************************************************************************
                                  Functions                                    
******************************************************************************/

/**
 * Recursively walks plain-objects and arrays, and calls a callback for
 * every key before descending into nested values.
 *
 * - Descends into a value if it is a plain-object or array.
 * - Fires callback for every entry (including plain-objects/arrays).
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
  node: PlainObject | unknown[],
  path: (string | number)[],
  cb: IterateCb,
): void {
  // Walk array
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const value = node[i];
      cb({ parent: node, key: i, value, path: path.slice() });
      if (isPlainObject(value) || Array.isArray(value)) {
        path.push(i);
        iterateHelper(value, path, cb);
        path.pop();
      }
    }
    return;
  }
  // Walk
  const dict = node as Record<string, unknown>;
  for (const key in dict) {
    if (!hop.call(dict, key)) continue;
    const value = dict[key];
    cb({ parent: dict, key, value, path: path.slice() });
    if (isPlainObject(value) || Array.isArray(value)) {
      path.push(key);
      iterateHelper(value, path, cb);
      path.pop();
    }
  }
}

/******************************************************************************
                                   Export                                      
******************************************************************************/

export default iterate;
