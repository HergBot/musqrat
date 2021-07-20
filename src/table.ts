import { SelectStatement } from './statement';

class Table<SchemaType> {
    private _name: string;

    constructor (name: string) {
        this._name = name;
    }

    get name(): string {
        return this._name;
    }

    select(...fields: (keyof SchemaType)[]): SelectStatement<SchemaType> {
        return new SelectStatement(this._name, fields);
    }

    update() {

    }

    delete() {

    }
};

export default Table;
