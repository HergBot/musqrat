import { IDbConnection } from "./connection";
import {
    InsertStatement,
    InsertValue,
    SelectStatement,
    DeleteStatement,
    UpdateStatement,
    SetClause,
} from "./statement";
import Table from "./table";
import {
    OptionalEmptyMulti,
    OptionalMulti,
    prepOptionalEmptyMulti,
} from "./utilities";

export const GENERIC_MUSQRAT_ERROR = "Generic Musqrat Mock Error";

class MockDbConnection<SchemaType> implements IDbConnection {
    private _results: Array<SchemaType>;

    constructor(results: OptionalEmptyMulti<SchemaType>) {
        this._results = prepOptionalEmptyMulti(results);
    }

    public async execute(query: string, values: any): Promise<[any[], any[]]> {
        return [
            this._results,
            this._results.length > 0 ? Object.keys(this._results[0]) : [],
        ];
    }
}

class ErrorDbConnection implements IDbConnection {
    private _error: string;

    constructor(error: string = GENERIC_MUSQRAT_ERROR) {
        this._error = error;
    }

    public async execute(query: string, values: any): Promise<[any[], any[]]> {
        throw new Error(this._error);
    }
}

export const mockDelete = <SchemaType>(
    table: Table<SchemaType>,
    error?: string
): jest.SpyInstance<DeleteStatement<SchemaType>> => {
    return jest
        .spyOn(table, "delete")
        .mockImplementation(
            () =>
                new DeleteStatement<SchemaType>(
                    table.name,
                    error
                        ? new ErrorDbConnection(error)
                        : new MockDbConnection([])
                )
        );
};

export const mockInsert = <
    SchemaType,
    PrimaryKey extends keyof SchemaType = never
>(
    table: Table<SchemaType, PrimaryKey>,
    values: OptionalMulti<InsertValue<SchemaType, PrimaryKey>>,
    error?: string
): jest.SpyInstance<InsertStatement<SchemaType, PrimaryKey>> => {
    return jest.spyOn(table, "insert").mockImplementation(
        () =>
            //Promise.resolve(Array.isArray(result) ? result : [result])
            new InsertStatement(
                table.name,
                values,
                error
                    ? new ErrorDbConnection(error)
                    : new MockDbConnection(values)
            )
    );
};

export const mockSelect = <
    SchemaType,
    PrimaryKey extends keyof SchemaType = never,
    JoinSchemas extends any[] = never[]
>(
    table: Table<SchemaType, PrimaryKey>,
    values: OptionalEmptyMulti<SchemaType> = [],
    error?: string
): jest.SpyInstance<SelectStatement<SchemaType, JoinSchemas>> => {
    // This cast is to stop a TypeScript error around JoinSchemas and any[]
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/33173
    const spy: jest.SpyInstance<SelectStatement<SchemaType, JoinSchemas>> =
        jest.spyOn(table, "select") as unknown as jest.SpyInstance<
            SelectStatement<SchemaType, JoinSchemas>
        >;
    spy.mockImplementation(() => {
        return new SelectStatement<SchemaType, JoinSchemas>(
            table.name,
            [],
            error ? new ErrorDbConnection(error) : new MockDbConnection(values)
        ) as SelectStatement<SchemaType, JoinSchemas>;
    });
    return spy;
};

export const mockUpdate = <
    SchemaType,
    PrimaryKey extends keyof SchemaType = never
>(
    table: Table<SchemaType, PrimaryKey>,
    updates: OptionalMulti<SetClause<SchemaType, PrimaryKey>>,
    values: OptionalEmptyMulti<SchemaType>,
    error?: string
): jest.SpyInstance<UpdateStatement<SchemaType>> => {
    return jest
        .spyOn(table, "update")
        .mockImplementation(
            () =>
                new UpdateStatement<SchemaType>(
                    table.name,
                    updates,
                    error
                        ? new ErrorDbConnection(error)
                        : new MockDbConnection(values)
                )
        );
};
