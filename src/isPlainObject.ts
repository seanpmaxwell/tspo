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
  if (arg === null || typeof arg !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(arg);
  return proto === objectProto || proto === null;
}

/******************************************************************************
                                    Export                                    
******************************************************************************/

export default isPlainObject;
