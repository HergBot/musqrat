import { Statement, SelectStatement, Nullable } from '../src/statement';

interface TestTableSchema {
    tableId: number;
    description: string;
    active: Nullable<boolean>;
}

describe('class Statement', () => {
    let statement: Statement<TestTableSchema>;

    beforeEach(() => {
        statement = new Statement<TestTableSchema>();
    });

    describe('method where', () => {
        test('with just one operation', () => {
            statement.where('active', '=', true);
            expect(statement.query).toEqual('WHERE active = TRUE');
        });

        test('with an AND operation', () => {
            statement.where({
                AND: [
                    {
                        field: 'tableId',
                        operator: '=',
                        value: 1
                    },
                    {
                        field: 'description',
                        operator: '!=',
                        value: 'done'
                    }
                ]
            });
            expect(statement.query).toEqual('WHERE (tableId = 1 AND description != \'done\')');
        });

        test('with an OR operation', () => {
            statement.where({
                OR: [
                    {
                        field: 'tableId',
                        operator: '>',
                        value: 5
                    },
                    {
                        field: 'active',
                        operator: 'IS',
                        value: null
                    }
                ]
            });
            expect(statement.query).toEqual('WHERE (tableId > 5 OR active IS NULL)');
        });

        test('with a nested aggregation', () => {
            statement.where({
                AND: [
                    {
                        OR: [
                            {
                                field: 'tableId',
                                operator: 'IN',
                                value: [1]
                            },
                            {
                                field: 'active',
                                operator: 'IS NOT',
                                value: null
                            }
                        ]
                    },
                    {
                        field: 'description',
                        operator: '!=',
                        value: 'done'
                    }
                ]
            });
            expect(statement.query).toEqual('WHERE ((tableId IN (1) OR active IS NOT NULL) AND description != \'done\')');
        });
    });
});