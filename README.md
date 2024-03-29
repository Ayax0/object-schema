# Object Schema

Inspired by Mongoose Schema to apply a predefined Schema to a javascript Object.

```
npm install @nextlvlup/object-schema
```

### Very basic usage example

```js
import ObjectSchema from '@nextlvlup/object-schema';

// Create User schema
interface User {
    firstName?: string;
    lastName?: string;
    age: number;
    birthday: Date;
    posts: [
        {
            id?: string;
            text: string;
        }
    ],
    permissions: string[];
}

const userSchema = new ObjectSchema<User>({
    firstName: String,
    lastName: String,
    age: { type: Number, default: 20 },
    birthday: { type: Date },
    posts: [
        {
            _id: { type: String, alias: "id" },
            text: { type: String, required: true },
        },
    ],
    permissions: [String],
});

/* Apply Schema an Options
 * the second parameter is optional,
 * valide options: reduce / strictType
 */
userSchema
    .filter(object, { reduce: false, strictType: false })
    .then((result) => /* filtered and reduced object */)
    .catch((err) => /* errors */);
```

### Field Options

| Option   | Input                            |
| -------- | -------------------------------- |
| type     | String / Number / Boolean / Date |
| required | true / false                     |
| default  | any                              |
| alias    | "aliasName"                      |
| regex    | /regexPatern/                    |

### Filter Options

| Option     | Description              |
| ---------- | ------------------------ |
| reduce     | remove empty objects     |
| strictType | error if type dont match |

-   if reduce is disabled, every empty object will be filled with undefined
-   if strictType is disabled, every wrong type will be converted
