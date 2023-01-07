import {
  DeleteStatement,
  InsertStatement,
  InsertValue,
  SelectStatement,
  UpdateStatement,
} from "../src/statement";
import Table from "../src/table";
import {
  GENERIC_MUSQRAT_ERROR,
  mockDelete,
  mockInsert,
  mockSelect,
  mockUpdate,
} from "../src/testing";
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

  it("should return 0 affected rows", async () => {
    spy = mockDelete(testTable, 0);
    const results = await testTable.delete().exec();
    expect(results.affectedRows).toEqual(0);
  });

  it("should return 3 affected rows", async () => {
    spy = mockDelete(testTable, 3);
    const results = await testTable.delete().exec();
    expect(results.affectedRows).toEqual(3);
  });

  it("should throw the default error message", async () => {
    spy = mockDelete(testTable, 3, GENERIC_MUSQRAT_ERROR);
    expect(testTable.delete().exec()).rejects.toThrowError(
      GENERIC_MUSQRAT_ERROR
    );
  });
});

describe("function mockInsert", () => {
  let spy: jest.SpyInstance<InsertStatement<TestTableSchema, "tableId">>;

  afterEach(() => {
    if (spy) {
      spy.mockRestore();
    }
  });

  it("should return the number of values given to it", async () => {
    spy = mockInsert(testTable, MOCK_INSERT_VALUES);
    const results = await testTable.insert(MOCK_INSERT_VALUES).exec();
    expect(results.affectedRows).toEqual(MOCK_INSERT_VALUES.length);
  });

  it("should throw the default error message", async () => {
    spy = mockInsert(testTable, MOCK_INSERT_VALUES, GENERIC_MUSQRAT_ERROR);
    expect(testTable.insert(MOCK_INSERT_VALUES).exec()).rejects.toThrowError(
      GENERIC_MUSQRAT_ERROR
    );
  });
});

describe("function mockSelect", () => {
  describe("with join schemas", () => {
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

    it("should return an empty array if no values are supposed to be returned", async () => {
      spy = mockSelect(testTable);
      const results = await testTable.select().exec();
      expect(results).toEqual([]);
    });

    it("should throw the default error message", async () => {
      spy = mockSelect(testTable, [], GENERIC_MUSQRAT_ERROR);
      expect(testTable.select().exec()).rejects.toThrowError(
        GENERIC_MUSQRAT_ERROR
      );
    });
  });

  describe("without join schemas", () => {
    let spy: jest.SpyInstance<SelectStatement<TestTableSchema>>;

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

    it("should throw the default error message", async () => {
      spy = mockSelect(testTable, [], GENERIC_MUSQRAT_ERROR);
      expect(testTable.select().exec()).rejects.toThrowError(
        GENERIC_MUSQRAT_ERROR
      );
    });
  });
});

describe("function mockUpdate", () => {
  let spy: jest.SpyInstance<UpdateStatement<TestTableSchema>>;

  afterEach(() => {
    if (spy) {
      spy.mockRestore();
    }
  });

  it("should return the number of values given to it", async () => {
    spy = mockUpdate(testTable, { field: "active", value: false }, MOCK_VALUES);
    const results = await testTable
      .update({ field: "active", value: false })
      .exec();
    expect(results.affectedRows).toEqual(MOCK_VALUES.length);
  });

  it("should throw the default error message", async () => {
    spy = mockUpdate(
      testTable,
      { field: "active", value: false },
      MOCK_VALUES,
      GENERIC_MUSQRAT_ERROR
    );
    expect(
      testTable.update({ field: "active", value: false }).exec()
    ).rejects.toThrowError(GENERIC_MUSQRAT_ERROR);
  });
});
