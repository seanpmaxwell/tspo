# jet-pojo

> To be clear, a **plain-old-javascript-object (pojo)** is any object which inherits directly from the base `Object` class and no other. This is different from objects created with `Object.create(null)` which do not have any inheritance; we'll refer to these as **bare-objects**. **pojos** can be created by calling `new Object()` or more-commonly through object-literals (i.e `{}`). Methods like `.hasOwnProperty` will work on **pojos** but not **bare-objects**.

### Reasons to use jet-pojo

- Avoid constantly have to caste your objects to different types
- Handle type-safety and runtime logic in one function call
- All type unions are collapsed so your can see the resolved type in your IDE.

// Header, TypeScript is great, but it can make modifying objects a pain sometimes. To get around the issues TypeScript throws at us when working with objects, I created `plain-object` which is a suite of runtime/compile-time functions for working with "PlainObject". A plain-object is an object created by an object-literal, the Object constructor, or Object.create(null)
