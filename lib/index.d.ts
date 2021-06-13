interface SchemaOptions {
    reduce?: boolean;
    strictType?: boolean;
}
export default class ObjectSchema {
    private schema;
    private readonly DEFAULT_OPTIONS;
    constructor(schema: Object);
    filter(item: Object | Array<any>, options?: SchemaOptions): Promise<Object>;
    private filterObject;
    private filterArray;
    private formatField;
    private generateEmptyObject;
}
export {};
//# sourceMappingURL=index.d.ts.map