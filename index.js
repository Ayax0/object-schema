function formatData(value, type) {
    //Skip formating if value is null
    if(value == undefined) return value;

    switch(type) {
        case String: return value.toString();
        case Number: return Number(`${value}`);
        default: return value;
    }
}

function generateDumy(schema) {
    //Define Dumy Object
    var _dumyObject = {};

    //Loop over all Schema Fields
    for(const [key, value] of Object.entries(schema)) {
        //If Field is SubObject
        if(typeof value == 'object' && typeof value.type != 'function') _dumyObject[key] = generateDumy(value);
        //If Field is Normal Value
        else _dumyObject[key] = undefined;

    }
    //Return DumyObject
    return _dumyObject;
}

module.exports = class ObjectSchema {

    constructor(schema) {
        this.schema = schema;
    }

    filter(item) {
        try {
            if(Array.isArray(this.schema)) return this.filterArray(item);
            else return this.filterObject(item);
        }catch(error) {
            return error;
        }
    }

    filterObject(object, _schema) {
        return new Promise(async (resolve, reject) => {
            //Define Object Schema
            if(!_schema) _schema = this.schema;

            //Initialize new Object
            var filteredObject = {};

            //Check if Provided Object is empty
            if(object == undefined) return resolve(generateDumy(_schema));
            
            //Loop over all Schema fields
            for(const [key, value] of Object.entries(_schema)) {
                //Initialize formated Value
                var formatedValue;

                //Check if Field is empty an Default Value is Provided
                if(object[key] == undefined) {
                    if(typeof value == 'object')
                        if(value.default) object[key] = value.default;
                }
                
                if(typeof value == 'object') {
                    //If Object is an Array
                    if(Array.isArray(value)) {
                        try {
                            formatedValue = await this.filterArray(object[key], value);
                        } catch(error) {
                            return reject(error);
                        }
                    }else {
                        //If Multiple Options are Available
                        if(typeof value.type == 'function') formatedValue = formatData(object[key], value.type);
                        //If Type is SubObject
                        else {
                            try {
                                formatedValue = await this.filterObject(object[key], _schema[key]);
                            }catch(error) {
                                return reject(error);
                            }
                        }
                    }
                }
                //If Field has only One Option
                else if(typeof value == 'function') {
                    formatedValue = formatData(object[key], value);
                }

                //Check if Field has Options
                const valueOptions = typeof value == 'object' && typeof value.type == 'function';

                //Check if Field has an Alias
                var fieldName = key;
                if(valueOptions && value.alias) fieldName = value.alias;

                //Check if Requirements are Pleased
                if(valueOptions && value.require && formatedValue == undefined) return reject(new Error(`SchemaError: Field '${fieldName}' is empty but required`));

                //Write Formated Value to new Object
                filteredObject[fieldName] = formatedValue;
            }

            //Return Object
            return resolve(filteredObject);
        });
    }

    filterArray(array, _schema) {
        return new Promise(async (resolve, reject) => {
            //Define Object Schema
            if(!_schema) _schema = this.schema;

            //Error Message if Schema is no Array
            if(!Array.isArray(_schema)) return reject(new Error("SchemaError: schema is no array"));

            //Check if Provided Object is empty
            if(array == undefined) return resolve([]);

            //Return if Data is no Array
            if(!Array.isArray(array)) return resolve(undefined);

            //Error Message if Array content is invalide
            if(_schema.length != 1) return reject(new Error("SchemaError: arrays can only hold one object or a type definition"));

            //Get Schema Entity
            const arrayEntity = _schema[0];

            //Initialize new Aray
            const formatedArray = [];

            array.forEach(async (item) => {
                if(typeof arrayEntity == 'function') formatedArray.push(formatData(item, arrayEntity));
                else if(typeof arrayEntity == 'object') {
                    try {
                        formatedArray.push(await this.filterObject(item, arrayEntity));
                    }catch(error) {
                        return reject(error);
                    }
                }
            });

            //Return Array
            return resolve(formatedArray);
        });
    }

}