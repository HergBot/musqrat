import { DeleteStatement, QueryStatement, SelectStatement, UpdateStatement, InsertStatement } from '../src/statement';
import Table from '../src/table';
import { Nullable } from '../src/utilities';

interface TestTableSchema {
    tableId: number;
    description: Nullable<string>;
    active: boolean;
}

interface ForeignTableSchema {
    foreignId: number;
    tableId: number;
    someColumn: string;
}

const TEST_TABLE: string = 'TEST_TABLE';

const FOREIGN_TABLE: string = 'FOREIGN_TABLE';

describe('class QueryStatement', () => {
    let statement: QueryStatement<TestTableSchema>;

    beforeEach(() => {
        statement = new QueryStatement<TestTableSchema>();
    });

    describe('method limit', () => {
        it('should apply a limit', () => {
            statement.limit(3);
            expect(statement.query).toEqual(`LIMIT 3`);
        });
    });

    describe('method orderBy', () => {
        it('should order by the default value (asc)', () => {
            statement.orderBy('tableId');
            expect(statement.query).toEqual(`ORDER BY tableId ASC`);
        });

        it('should order by desc', () => {
            statement.orderBy('tableId', 'DESC');
            expect(statement.query).toEqual(`ORDER BY tableId DESC`);
        });
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
                        field: 'description',
                        operator: 'IS',
                        value: null
                    }
                ]
            });
            expect(statement.query).toEqual('WHERE (tableId > 5 OR description IS NULL)');
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
                                field: 'description',
                                operator: 'IS NOT',
                                value: null
                            }
                        ]
                    },
                    {
                        field: 'active',
                        operator: '!=',
                        value: false
                    }
                ]
            });
            expect(statement.query).toEqual('WHERE ((tableId IN (1) OR description IS NOT NULL) AND active != FALSE)');
        });
    });
});

describe('class SelectStatement', () => {
    const BASE_STATMENT = `SELECT tableId FROM ${TEST_TABLE}`;
    let statement: SelectStatement<TestTableSchema>;

    beforeEach(() => {
        statement = new SelectStatement<TestTableSchema>(TEST_TABLE, ['tableId']);
    });
    
    describe('constructor', () => {
        describe('when given only a table name', () => {
            beforeEach(() => {
                statement = new SelectStatement<TestTableSchema>(TEST_TABLE);
            });

            it('should select all the fields', () => {
                expect(statement.query).toEqual(`SELECT * FROM ${TEST_TABLE}`);
            });
        })

        it('should select the given fields', () => {
            expect(statement.query).toEqual(BASE_STATMENT);
        });
    });

    describe('method innerJoin', () => {
        let joinStatement: SelectStatement<TestTableSchema, [ForeignTableSchema]>;
        let foreignTable: Table<ForeignTableSchema>;

        beforeEach(() => {
            joinStatement = new SelectStatement<TestTableSchema, [ForeignTableSchema]>(TEST_TABLE, ['tableId'])
            foreignTable = new Table<ForeignTableSchema>(FOREIGN_TABLE);
        });

        it('should join on the given table/fields', () => {
            joinStatement.innerJoin(foreignTable, 'tableId', 'tableId');
            expect(joinStatement.query).toEqual(`${BASE_STATMENT} INNER JOIN FOREIGN_TABLE ON tableId = tableId`);
        });
    });
    
    describe('method groupBy', () => {
        it('should group by the field', () => {
            statement.groupBy('active');
            expect(statement.query).toEqual(`${BASE_STATMENT} GROUP BY active`);
        });
    });
});

describe('class UpdateStatement', () => {
    const BASE_STATMENT = `UPDATE ${TEST_TABLE}`;
    let statement: UpdateStatement<TestTableSchema>;

    describe('constructor', () => {
        describe('with a single update', () => {
            beforeEach(() => {
                statement = new UpdateStatement<TestTableSchema>(TEST_TABLE, {field: 'active', value: false});
            });
    
            it('should format the update', () => {
                expect(statement.query).toEqual(`${BASE_STATMENT} SET active = FALSE`);
            });
        });
    
        describe('with multiple updates', () => {
            beforeEach(() => {
                statement = new UpdateStatement<TestTableSchema>(TEST_TABLE, [
                    {field: 'description', value: null},
                    {field: 'active', value: false}
                ]);
            });
    
            it('should format the update', () => {
                expect(statement.query).toEqual(`${BASE_STATMENT} SET description = NULL, active = FALSE`);
            });
        });
    });
});

describe('class DeleteStatement', () => {
    let statement: DeleteStatement<TestTableSchema>;

    describe('constructor', () => {
        beforeEach(() => {
            statement = new DeleteStatement<TestTableSchema>(TEST_TABLE);
        });

        it('should format the delete', () => {
            expect(statement.query).toEqual(`DELETE FROM ${TEST_TABLE}`);
        });
    });
});

describe('class InsertStatement', () => {
    const BASE_STATMENT = `INSERT INTO ${TEST_TABLE}`;
    let statement: InsertStatement<TestTableSchema>;

    describe('constructor', () => {
        describe('with a single value', () => {
            beforeEach(() => {
                statement = new InsertStatement<TestTableSchema, 'tableId'>(TEST_TABLE, {active: false, description: 'something'});
            });
    
            it('should format the update', () => {
                expect(statement.query).toEqual(`${BASE_STATMENT} (active, description) VALUES (FALSE, 'something')`);
            });
        });
    
        describe('with multiple values', () => {
            beforeEach(() => {
                statement = new InsertStatement<TestTableSchema>(TEST_TABLE, [
                    {tableId: 1, active: false, description: 'something'},
                    {tableId: 2, active: true, description: null}
                ]);
            });
    
            it('should format the update', () => {
                expect(statement.query).toEqual(`${BASE_STATMENT} (tableId, active, description) VALUES (1, FALSE, 'something'), (2, TRUE, NULL)`);
            });
        });
    });
});