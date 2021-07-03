import Table from '../src/table';

interface TestTableSchema {
    tableId: number;
    description: string;
    active: boolean;
}

const TEST_TABLE = 'Test_Table';

describe('class Table', () => {
    let testTable: Table<TestTableSchema>;

    beforeEach(() => {
        testTable = new Table<TestTableSchema>(TEST_TABLE);
    });

    describe('function select', () => {
        test('first test', () => {
            expect(testTable.select('tableId').exec()).toEqual('SELECT tableId FROM Test_Table');
        });
    });
});