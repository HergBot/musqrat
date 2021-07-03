interface TestTableSchema {
    tableId: number;
    description: string;
    active: boolean;
}

const TestTable = new Table<TestTableSchema>('Test_Table');

console.log(TestTable.select('tableId', 'description', 'active').exec());

/*
TestTable.select(['column1', 'column2'])
    .innerJoin(Table2, 'column3', 'column2')
    .where()
    .orderBy()
    .groupBy()
    .limit()
    .exec()

TestTable.update()
    .set({
        column1: value
    })
    .where()
    .exec()

TestTable.delete()
    .where()
    .exec()

*/