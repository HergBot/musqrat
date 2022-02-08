import {
    InsertStatement,
    InsertValue,
    SelectStatement,
} from "../src/statement";
import Table from "../src/table";
import { mockInsert, mockSelect } from "../src/testing";
import { Nullable, OptionalMulti } from "../src/utilities";

interface TestTableSchema {
    tableId: number;
    description: Nullable<string>;
    active: boolean;
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

describe("function mockSelect", () => {
    let spy: jest.SpyInstance<SelectStatement<TestTableSchema, any[]>>;

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
