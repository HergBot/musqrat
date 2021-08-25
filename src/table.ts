import { IDbConnection } from "./connection";

import {
    DeleteStatement,
    InsertStatement,
    SelectStatement,
    SetClause,
    UpdateStatement,
} from "./statement";
import { AnyKeyInArray, OptionalMulti } from "./utilities";

/**
 * Table class wrapping all the available operations plus table and connection info.
 */
class Table<SchemaType, PrimaryKey extends keyof SchemaType = never> {
    private _name: string;
    private _connection: IDbConnection | undefined;

    constructor(name: string, connection?: IDbConnection) {
        this._name = name;
        this._connection = connection;
    }

    get name(): string {
        return this._name;
    }

    /**
     * Prepares a base delete statement.
     * @returns The base delete statement.
     */
    delete(): DeleteStatement<SchemaType> {
        return new DeleteStatement<SchemaType>(this._name, this._connection);
    }

    /**
     * Prepares a base insert statement.
     * @param values The values to insert.
     * @returns The base insert statement.
     */
    insert(
        values: OptionalMulti<Omit<SchemaType, PrimaryKey>>
    ): InsertStatement<SchemaType> {
        return new InsertStatement<SchemaType, PrimaryKey>(
            this._name,
            values,
            this._connection
        );
    }

    /**
     * Prepares a base select statement.
     * @param fields The fields to select (optional)
     * @returns The base select statement.
     */
    select<JoinSchemas extends any[] = never[]>(
        ...fields: (keyof SchemaType | AnyKeyInArray<JoinSchemas>[number])[]
    ): SelectStatement<SchemaType, JoinSchemas> {
        return new SelectStatement<SchemaType, JoinSchemas>(
            this._name,
            fields,
            this._connection
        );
    }

    /**
     * Prepares a base update statement.
     * @param updates The updates to make.
     * @returns The base update statement.
     */
    update(updates: OptionalMulti<SetClause<SchemaType>>) {
        return new UpdateStatement<SchemaType>(
            this._name,
            updates,
            this._connection
        );
    }
}

export default Table;
