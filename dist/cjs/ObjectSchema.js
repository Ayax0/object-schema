"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectSchema = void 0;
class ObjectSchema {
    constructor(schema) {
        this.DEFAULT_OPTIONS = {
            reduce: false,
            strictType: false,
        };
        this.schema = schema;
    }
    filter(item, options = this.DEFAULT_OPTIONS) {
        return new Promise((resolve, reject) => {
            if (Array.isArray(this.schema))
                this.filterArray(item, options, this.schema)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            else
                this.filterObject(item, options, this.schema)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
        });
    }
    filterObject(item, options, subschema) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var filteredObject = {};
            //Check if empty
            if (item == undefined && !options.reduce) {
                try {
                    return resolve((yield this.generateEmptyObject(subschema, options)));
                }
                catch (error) {
                    return reject(error);
                }
            }
            if (item == undefined && options.reduce)
                return resolve(undefined);
            //Loop Over Schema
            for (const [key, value] of Object.entries(subschema)) {
                var formatedKey = undefined;
                var formatedValue = undefined;
                // if FieldOptions provided
                if (value.type instanceof Function) {
                    //Default Value
                    if (item[key] == undefined && value.default)
                        formatedValue = yield this.formatField(value.default, value.type, options);
                    //Alias
                    if (value.alias)
                        formatedKey = value.alias;
                    //Format Value
                    if (item[key] != undefined) {
                        try {
                            formatedValue = yield this.formatField(item[key], value.type, options);
                        }
                        catch (error) {
                            return reject(error);
                        }
                    }
                    //Required
                    if (formatedValue == undefined && value.required)
                        return reject(new Error(`SchemaError: Field '${key}' is empty but required`));
                    //Regex
                    if (value.regex && !value.regex.test(formatedValue))
                        return reject(new Error(`SchemaError: Field '${key}' dont match regex`));
                }
                // if only type provided
                else {
                    //Sub Object / Array
                    if (typeof value == "object") {
                        if (Array.isArray(value)) {
                            try {
                                formatedValue = yield this.filterArray(item[key], options, value);
                            }
                            catch (error) {
                                return reject(error);
                            }
                        }
                        else {
                            try {
                                formatedValue = yield this.filterObject(item[key], options, value);
                            }
                            catch (error) {
                                return reject(error);
                            }
                        }
                    }
                    //Primitiv Value
                    else {
                        try {
                            formatedValue = yield this.formatField(item[key], value, options);
                        }
                        catch (error) {
                            return reject(error);
                        }
                    }
                }
                //Write Formated Field to Object
                if (!(options.reduce && formatedValue == undefined))
                    filteredObject[formatedKey ? formatedKey : key] = formatedValue;
            }
            return resolve(filteredObject);
        }));
    }
    filterArray(item, options, subschema) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            //Check if empty
            if (item == undefined && !options.reduce)
                return resolve([]);
            if (item == undefined && options.reduce)
                return resolve(undefined);
            //Error if Not Array
            if (!Array.isArray(subschema))
                return reject(new Error("SchemaError: schema is no array"));
            if (!Array.isArray(item))
                return reject(new Error("SchemaError: item is no array"));
            //Error Message if Array content is invalide
            if (subschema.length != 1)
                return reject(new Error("SchemaError: arrays can only hold an object or a type definition"));
            var arraySchema = subschema[0];
            var formatedArray = [];
            for (var i = 0; i < item.length; i++) {
                const subitem = item[i];
                if (typeof arraySchema == "object") {
                    if (Array.isArray(arraySchema))
                        return reject("SchemaError: Array can't hold other array");
                    try {
                        formatedArray.push(yield this.filterObject(subitem, options, arraySchema));
                    }
                    catch (error) {
                        return reject(error);
                    }
                }
                else {
                    try {
                        formatedArray.push((yield this.formatField(subitem, arraySchema, options)));
                    }
                    catch (error) {
                        return reject(error);
                    }
                }
            }
            return resolve(options.reduce && formatedArray.length == 0 ? undefined : formatedArray);
        }));
    }
    formatField(data, type, options) {
        return new Promise((resolve, reject) => {
            if (data == undefined)
                return resolve(null);
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
                case Date:
                    if (typeof data == "string")
                        return resolve(new Date(Date.parse(data)));
                    if (data instanceof Date)
                        return resolve(data);
                    if (options.strictType)
                        return reject(new Error(`SchemaError: invalide type ${typeof data} expected date`));
                    return resolve(new Date(data.toString()));
                default:
                    return resolve(data);
            }
        });
    }
    generateEmptyObject(schema, options) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(schema))
                return resolve([]);
            var emptyObject = {};
            for (const [key, value] of Object.entries(schema)) {
                if (value.type instanceof Function) {
                    var formatedKey = undefined;
                    var formatedValue = undefined;
                    if (value.required && !value.default)
                        return reject(new Error(`SchemaError: Field '${key}' is empty but required`));
                    if (value.default)
                        formatedValue = yield this.formatField(value.default, value.type, options);
                    if (value.alias)
                        formatedKey = value.alias;
                    emptyObject[formatedKey ? formatedKey : key] = formatedValue ? formatedValue : null;
                }
                else {
                    if (typeof value == "object") {
                        try {
                            emptyObject[key] = yield this.generateEmptyObject(value, options);
                        }
                        catch (error) {
                            return reject(error);
                        }
                    }
                    else
                        emptyObject[key] = null;
                }
            }
            return resolve(emptyObject);
        }));
    }
}
exports.ObjectSchema = ObjectSchema;
//# sourceMappingURL=ObjectSchema.js.map