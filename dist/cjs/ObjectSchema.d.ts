export interface SchemaOptions {
    reduce?: boolean;
    strictType?: boolean;
}
export declare class ObjectSchema<T> {
    private schema;
    private readonly DEFAULT_OPTIONS;
    constructor(schema: Object);
    filter(item: any | Array<any>, options?: SchemaOptions): Promise<T>;
    private filterObject;
    private filterArray;
    private formatField;
    private generateEmptyObject;
}
