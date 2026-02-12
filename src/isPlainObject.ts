/******************************************************************************
                                  Constants                                    
******************************************************************************/

const objectProto = Object.prototype;

/******************************************************************************
                                      Types                                    
******************************************************************************/

// Basic Types
export type Dict = Record<string, unknown>;
export type POJO = NonNullable<object>;

/******************************************************************************
                                     Functions                                    
******************************************************************************/

/**
 * Check if a 'unknown' is a 'PlainObject.
 */
function isPlainObject(arg: unknown): arg is POJO {
  if (typeof arg !== 'object' || arg === null) {
    return false;
  }
  const argProto = Object.getPrototypeOf(arg);
  return (
    (argProto === null ||
      argProto === objectProto ||
      Object.getPrototypeOf(argProto) === null) &&
    !(Symbol.toStringTag in arg) &&
    !(Symbol.iterator in arg)
  );
}

/******************************************************************************
                                    Export                                    
******************************************************************************/

export default isPlainObject;
