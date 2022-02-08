import { IDbConnection } from "./connection";
import {
    InsertStatement,
    QueryVariable,
    BaseStatement,
    QueryStatement,
    InsertValue,
    SelectStatement,
    DeleteStatement,
    UpdateStatement,
    SetClause,
} from "./statement";
import Table from "./table";
import { OptionalMulti, prepOptionalMulti } from "./utilities";

class MockBaseStatement<SchemaType> extends BaseStatement<SchemaType> {
    private _results: Array<SchemaType>;

    constructor(results: Array<SchemaType>) {
        super(undefined);
        this._results = results;
    }

    /**
     * Executes the query.
     * @throws When the database connection is not given.
     * @returns The rows returned if any.
     */
    public async exec(): Promise<SchemaType[]> {
        return this._results;
    }
}

class MockDbConnection<SchemaType> implements IDbConnection {
    private _results: Array<SchemaType>;

    constructor(results: OptionalMulti<SchemaType>) {
        this._results = prepOptionalMulti(results);
    }

    public async execute(query: string, values: any): Promise<[any[], any[]]> {
        console.log(this._results);
        return [
            this._results,
            this._results.length > 0 ? Object.keys(this._results[0]) : [],
        ];
    }
}

/*class MockQueryStatement<SchemaType>
    extends MockBaseStatement<SchemaType>, QueryStatement<SchemaType>
{
    constructor(results: Array<SchemaType>) {
        super(results);
    }
}*/

/*export const mockInsert = <T>(
    result: OptionalMulti<T>
): jest.SpyInstance<Promise<T[]>> => {
    return jest
        .spyOn(InsertStatement.prototype, "exec")
        .mockImplementation(() =>
            Promise.resolve(Array.isArray(result) ? result : [result])
        );
};*/

export const mockDelete = <SchemaType>(
    table: Table<SchemaType>
): jest.SpyInstance<DeleteStatement<SchemaType>> => {
    return jest
        .spyOn(table, "delete")
        .mockImplementation(
            () =>
                new DeleteStatement<SchemaType>(
                    table.name,
                    new MockDbConnection([])
                )
        );
};

export const mockInsert = <
    SchemaType,
    PrimaryKey extends keyof SchemaType = never
>(
    table: Table<SchemaType, PrimaryKey>,
    values: OptionalMulti<InsertValue<SchemaType, PrimaryKey>>
): jest.SpyInstance<InsertStatement<SchemaType, PrimaryKey>> => {
    return jest.spyOn(table, "insert").mockImplementation(
        () =>
            //Promise.resolve(Array.isArray(result) ? result : [result])
            new InsertStatement(
                table.name,
                values,
                new MockDbConnection(values)
            )
    );
};

// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/33173
export const mockSelect = <
    SchemaType,
    PrimaryKey extends keyof SchemaType = never,
    JoinSchemas extends any[] = never[]
>(
    table: Table<SchemaType, PrimaryKey>,
    values: OptionalMulti<SchemaType>
): jest.SpyInstance<SelectStatement<SchemaType, any[]>> => {
    return jest
        .spyOn(table, "select")
        .mockImplementation((): SelectStatement<SchemaType, JoinSchemas> => {
            return new SelectStatement<SchemaType, JoinSchemas>(
                table.name,
                [],
                new MockDbConnection(values)
            ) as SelectStatement<SchemaType, JoinSchemas>;
        });
};

export const mockUpdate = <SchemaType>(
    table: Table<SchemaType>,
    updates: OptionalMulti<SetClause<SchemaType>>,
    values: OptionalMulti<SchemaType>
): jest.SpyInstance<UpdateStatement<SchemaType>> => {
    return jest
        .spyOn(table, "update")
        .mockImplementation(
            () =>
                new UpdateStatement<SchemaType>(
                    table.name,
                    updates,
                    new MockDbConnection(values)
                )
        );
};
