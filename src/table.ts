import { IDbConnection } from './connection';

import { DeleteStatement, InsertStatement, SelectStatement, SetClause, UpdateStatement } from './statement';
import { AnyKeyInArray, OptionalMulti } from './utilities';

class Table<SchemaType, PrimaryKey extends keyof SchemaType = never> {
    private _name: string;
    private _connection: IDbConnection | undefined;

    constructor (name: string, connection?: IDbConnection, ) {
        this._name = name;
        this._connection = connection;
    }

    get name(): string {
        return this._name;
    }

    delete(): DeleteStatement<SchemaType> {
        return new DeleteStatement<SchemaType>(this._name, this._connection);
    }

    insert(values: OptionalMulti<Omit<SchemaType, PrimaryKey>>): InsertStatement<SchemaType> {
        return new InsertStatement<SchemaType, PrimaryKey>(this._name, values, this._connection);
    }

    select<JoinSchemas extends any[] = never[]>(...fields: (keyof SchemaType | AnyKeyInArray<JoinSchemas>[number])[]): SelectStatement<SchemaType, JoinSchemas> {
        return new SelectStatement<SchemaType, JoinSchemas>(this._name, fields, this._connection);
    }

    update(updates: OptionalMulti<SetClause<SchemaType>>) {
        return new UpdateStatement<SchemaType>(this._name, updates, this._connection);
    }
};

export default Table;
