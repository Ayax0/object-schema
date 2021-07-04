type FieldTypesConstructor = StringConstructor | NumberConstructor | BooleanConstructor | ObjectConstructor | ArrayConstructor;
type FieldTypes = String | Number | Boolean | null | Object | Array<String | Number | Boolean | null | Object>;

export interface SchemaOptions {
    reduce?: boolean;
    strictType?: boolean;
}

export default class ObjectSchema {
    private schema: Object | Array<any>;

    private readonly DEFAULT_OPTIONS: SchemaOptions = {
        reduce: false,
        strictType: false,
    };

    constructor(schema: Object) {
        this.schema = schema;
    }

    filter(item: Object | Array<any>, options: SchemaOptions = this.DEFAULT_OPTIONS): Promise<Object> {
        return new Promise((resolve, reject) => {
            if (Array.isArray(this.schema))
                this.filterArray(<Array<any>>item, options, this.schema)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            else
                this.filterObject(item, options, this.schema)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
        });
    }

    private filterObject(item: Object, options: SchemaOptions, subschema: Object): Promise<Object> {
        return new Promise(async (resolve, reject) => {
            var filteredObject = {};

            //Check if empty
            if (item == undefined && !options.reduce) {
                try {
                    return resolve(await this.generateEmptyObject(subschema, options));
                } catch (error) {
                    return reject(error);
                }
            }
            if (item == undefined && options.reduce) return resolve(undefined);

            //Loop Over Schema
            for (const [key, value] of Object.entries(subschema)) {
                var formatedKey = undefined;
                var formatedValue = undefined;

                // if FieldOptions provided
                if (value.type instanceof Function) {
                    //Default Value
                    if (item[key] == undefined && value.default) formatedValue = await this.formatField(value.default, value.type, options);

                    //Alias
                    if (value.alias) formatedKey = value.alias;

                    //Format Value
                    if (item[key] != undefined) {
                        try {
                            formatedValue = await this.formatField(item[key], value.type, options);
                        } catch (error) {
                            return reject(error);
                        }
                    }

                    //Required
                    if (formatedValue == undefined && value.required) return reject(new Error(`SchemaError: Field '${key}' is empty but required`));
                }
                // if only type provided
                else {
                    //Sub Object / Array
                    if (typeof value == "object") {
                        if (Array.isArray(value)) {
                            try {
                                formatedValue = await this.filterArray(item[key], options, value);
                            } catch (error) {
                                return reject(error);
                            }
                        } else {
                            try {
                                formatedValue = await this.filterObject(item[key], options, value);
                            } catch (error) {
                                return reject(error);
                            }
                        }
                    }
                    //Primitiv Value
                    else {
                        try {
                            formatedValue = await this.formatField(item[key], value, options);
                        } catch (error) {
                            return reject(error);
                        }
                    }
                }

                //Write Formated Field to Object
                if (!(options.reduce && formatedValue == undefined)) filteredObject[formatedKey ? formatedKey : key] = formatedValue;
            }

            return resolve(filteredObject);
        });
    }

    private filterArray(item: Array<any>, options: SchemaOptions, subschema: Array<any>): Promise<Object> {
        return new Promise(async (resolve, reject) => {
            //Check if empty
            if (item == undefined && !options.reduce) return resolve([]);
            if (item == undefined && options.reduce) return resolve(undefined);

            //Error if Not Array
            if (!Array.isArray(subschema)) return reject(new Error("SchemaError: schema is no array"));
            if (!Array.isArray(item)) return reject(new Error("SchemaError: item is no array"));

            //Error Message if Array content is invalide
            if (subschema.length != 1) return reject(new Error("SchemaError: arrays can only hold an object or a type definition"));

            var arraySchema = subschema[0];
            var formatedArray = [];

            for (var i = 0; i < item.length; i++) {
                const subitem = item[i];
                if (typeof arraySchema == "object") {
                    if (Array.isArray(arraySchema)) return reject("SchemaError: Array can't hold other array");

                    try {
                        formatedArray.push(await this.filterObject(subitem, options, arraySchema));
                    } catch (error) {
                        return reject(error);
                    }
                } else {
                    try {
                        formatedArray.push(await this.formatField(subitem, arraySchema, options));
                    } catch (error) {
                        return reject(error);
                    }
                }
            }
            return resolve(options.reduce && formatedArray.length == 0 ? undefined : formatedArray);
        });
    }

    private formatField(data: FieldTypes, type: FieldTypesConstructor, options: SchemaOptions) {
        return new Promise((resolve, reject) => {
            if (data == undefined) return resolve(data);
            switch (type) {
                case String:
                    if (typeof data != "string" && options.strictType)
                        return reject(new Error(`SchemaError: invalide type ${typeof data} expected string`));
                    return resolve(data.toString());
                case Number:
                    if (typeof data != "number" && options.strictType)
                        return reject(new Error(`SchemaError: invalide type ${typeof data} expected number`));
                    return resolve(Number(`${data}`));
                case Boolean:
                    if (typeof data != "boolean" && options.strictType)
                        return reject(new Error(`SchemaError: invalide type ${typeof data} expected boolean`));
                    switch (typeof data) {
                        case "boolean":
                            return resolve(data);
                        case "string":
                            return resolve(data == "true" || data == "1");
                        case "number":
                            return resolve(data == 1);
                    }
                    return resolve(data);
                default:
                    return resolve(data);
            }
        });
    }

    private generateEmptyObject(schema: Object, options: SchemaOptions) {
        return new Promise(async (resolve, reject) => {
            if (Array.isArray(schema)) return resolve([]);

            var emptyObject = {};

            for (const [key, value] of Object.entries(schema)) {
                if (value.type instanceof Function) {
                    var formatedKey = undefined;
                    var formatedValue = undefined;

                    if (value.required && !value.default) return reject(new Error(`SchemaError: Field '${key}' is empty but required`));
                    if (value.default) formatedValue = await this.formatField(value.default, value.type, options);
                    if (value.alias) formatedKey = value.alias;

                    emptyObject[formatedKey ? formatedKey : key] = formatedValue ? formatedValue : undefined;
                } else {
                    if (typeof value == "object") {
                        try {
                            emptyObject[key] = await this.generateEmptyObject(value, options);
                        } catch (error) {
                            return reject(error);
                        }
                    } else emptyObject[key] = undefined;
                }
            }

            return resolve(emptyObject);
        });
    }
}
