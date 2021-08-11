import { IDbConnection } from './connection';

import { SelectStatement } from './statement';

class Table<SchemaType> {
    private _name: string;
    private _connection: IDbConnection | undefined;

    constructor (name: string, connection?: IDbConnection, ) {
        this._name = name;
        this._connection = connection;
    }

    get name(): string {
        return this._name;
    }

    select(...fields: (keyof SchemaType)[]): SelectStatement<SchemaType> {
        return new SelectStatement(this._name, fields, this._connection);
    }

    update() {

    }

    delete() {

    }
};

export default Table;
