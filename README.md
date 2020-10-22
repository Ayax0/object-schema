Object Schema
==================

Inspired by Mongoose Schema to apply a predefined Schema to a javascript Object.

```
npm install @nextlvlup/object-schema
```

# Very basic usage example
```js
var ObjectSchema = require('@nextlvlup/object-schema');

// Create User schema
var userSchema = new ObjectSchema({
  firstName: String,
  lastName: String,
  age: { type: Number, default: 20 },
  posts: [
    {
      _id: { type: String, alias: 'id },
      text: { type: String, require: true },
    }
  ],
  permissions: [ String ]
});

// Apply Schema to Object
userSchema.filter(object)
.then((result) => /* filtered object */)
.catch((err) => /* errors */);
```
