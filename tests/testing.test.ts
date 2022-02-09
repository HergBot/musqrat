import {
  DeleteStatement,
  InsertStatement,
  InsertValue,
  SelectStatement,
  UpdateStatement,
} from "../src/statement";
import Table from "../src/table";
import { mockDelete, mockInsert, mockSelect, mockUpdate } from "../src/testing";
import { Nullable, OptionalMulti } from "../src/utilities";

interface TestTableSchema {
  tableId: number;
  description: Nullable<string>;
  active: boolean;
}

interface JoinTableSchema {
  tableId: number;
  joinId: number;
}

const TEST_TABLE = "Test_Table";
const MOCK_INSERT_VALUES: OptionalMulti<
  InsertValue<TestTableSchema, "tableId">
> = [{ description: "", active: false }];
const MOCK_VALUES: OptionalMulti<TestTableSchema> = [
  { tableId: 1, description: "", active: true },
];
let testTable: Table<TestTableSchema, "tableId">;

beforeEach(() => {
  testTable = new Table<TestTableSchema, "tableId">(TEST_TABLE);
});

describe("function mockDelete", () => {
  let spy: jest.SpyInstance<DeleteStatement<TestTableSchema>>;

  afterEach(() => {
    if (spy) {
      spy.mockRestore();
    }
  });

  it("should return the values given to it", async () => {
    spy = mockDelete(testTable);
    const results = await testTable.delete().exec();
    expect(results).toEqual([]);
  });
});

describe("function mockInsert", () => {
  let spy: jest.SpyInstance<InsertStatement<TestTableSchema, "tableId">>;

  afterEach(() => {
    if (spy) {
      spy.mockRestore();
    }
  });

  it("should return the values given to it", async () => {
    spy = mockInsert(testTable, MOCK_INSERT_VALUES);
    const results = await testTable.insert(MOCK_INSERT_VALUES).exec();
    expect(results).toEqual(MOCK_INSERT_VALUES);
  });
});

describe("function mockSelect", () => {
  let spy: jest.SpyInstance<
    SelectStatement<TestTableSchema, [JoinTableSchema]>
  >;

  afterEach(() => {
    if (spy) {
      spy.mockRestore();
    }
  });

  it("should return the values given to it", async () => {
    spy = mockSelect(testTable, MOCK_VALUES);
    const results = await testTable.select().exec();
    expect(results).toEqual(MOCK_VALUES);
  });
});

describe("function mockUpdate", () => {
  let spy: jest.SpyInstance<UpdateStatement<TestTableSchema>>;

  afterEach(() => {
    if (spy) {
      spy.mockRestore();
    }
  });

  it("should return the values given to it", async () => {
    spy = mockUpdate(testTable, { field: "active", value: false }, MOCK_VALUES);
    const results = await testTable
      .update({ field: "active", value: false })
      .exec();
    expect(results).toEqual(MOCK_VALUES);
  });
});
