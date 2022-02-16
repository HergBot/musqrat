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
  prepOptionalMulti,
} from "./utilities";

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

export const mockDelete = <SchemaType>(
  table: Table<SchemaType>
): jest.SpyInstance<DeleteStatement<SchemaType>> => {
  return jest
    .spyOn(table, "delete")
    .mockImplementation(
      () =>
        new DeleteStatement<SchemaType>(table.name, new MockDbConnection([]))
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
      new InsertStatement(table.name, values, new MockDbConnection(values))
  );
};

export const mockSelect = <
  SchemaType,
  PrimaryKey extends keyof SchemaType = never,
  JoinSchemas extends any[] = never[]
>(
  table: Table<SchemaType, PrimaryKey>,
  values: OptionalEmptyMulti<SchemaType> = []
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
      new MockDbConnection(values)
    ) as SelectStatement<SchemaType, JoinSchemas>;
  });
  return spy;
};

export const mockUpdate = <SchemaType>(
  table: Table<SchemaType>,
  updates: OptionalMulti<SetClause<SchemaType>>,
  values: OptionalEmptyMulti<SchemaType>
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
