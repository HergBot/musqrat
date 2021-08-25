import Table from '../src/table';

interface TestTableSchema {
    tableId: number;
    description: string;
    active: boolean;
}

interface TestJoinSchema {
    joinId: number;
    tableId: number;
}

const TEST_TABLE = 'Test_Table';
const JOIN_TABLE = 'Join_Table';

describe('class Table', () => {
    let testTable: Table<TestTableSchema, 'tableId'>;
    let foreignTable: Table<TestJoinSchema>;

    beforeEach(() => {
        testTable = new Table<TestTableSchema, 'tableId'>(TEST_TABLE);
        foreignTable = new Table<TestJoinSchema>(JOIN_TABLE);
    });

    describe('method delete', () => {
        test('full delete statment', () => {
            expect(testTable.delete().where('tableId', '=', 5).orderBy('active', 'DESC').limit(1).query)
                .toEqual(`DELETE FROM ${TEST_TABLE} WHERE tableId = ? ORDER BY active DESC LIMIT 1`);
        });
    });

    describe('method insert', () => {
        test('full insert statement', () => {
            expect(testTable.insert([{active: true, description: 'description'}]).query)
                .toEqual(`INSERT INTO ${TEST_TABLE} (active, description) VALUES (?, ?)`);
        });
    });

    describe('method select', () => {
        test('select all', () => {
            expect(testTable.select().query).toEqual(`SELECT * FROM ${TEST_TABLE}`);
        });

        test('full select statement without joins', () => {
            expect(testTable.select('tableId', 'description').groupBy('tableId').where(
                {
                    AND: [
                        {field: 'tableId', operator: 'IN', value: [1, 2, 3]},
                        {field: 'active', operator: '=', value: true}
                    ]
                }
            ).orderBy('tableId').limit(5).query)
                .toEqual(`SELECT tableId, description FROM ${TEST_TABLE} GROUP BY tableId WHERE (tableId IN ? AND active = ?) ORDER BY tableId ASC LIMIT 5`);
        });

        test('statement with joins', () => {
            expect(testTable.select<[TestJoinSchema]>('tableId', 'joinId').innerJoin(foreignTable, 'tableId', 'tableId').query)
                .toEqual(`SELECT tableId, joinId FROM ${TEST_TABLE} INNER JOIN ${JOIN_TABLE} ON tableId = tableId`)
        });
    });

    describe('method update', () => {
        test('full update statement', () => {
            expect(testTable.update({field: 'active', value: false}).where('tableId', '=', 1).orderBy('tableId').limit(1).query)
                .toEqual(`UPDATE ${TEST_TABLE} SET active = ? WHERE tableId = ? ORDER BY tableId ASC LIMIT 1`);
        });
    });
});