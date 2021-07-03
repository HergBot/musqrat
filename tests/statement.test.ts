import { SelectStatement } from '../src/statement';

interface TestTableSchema {
    tableId: number;
    description: string;
    active: boolean;
}

describe('class SelectStatement', () => {
    let selectStatement: SelectStatement<TestTableSchema>;

    beforeEach(() => {
        selectStatement = new SelectStatement<TestTableSchema>('Test_Table', ['tableId', 'description'])
    });

    test('description', () => {
        selectStatement.innerJoin().where().orderBy().exec();
    });
});