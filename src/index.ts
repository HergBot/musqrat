import mysql from 'mysql2/promise';

import Table from './table';

class Musqrat {
    private _pool: mysql.Pool | null;

    constructor() {
        this._pool = null;
    }
    
    public connect(config: mysql.PoolOptions) {
        this._pool = mysql.createPool(config);
    }

    public initTable<TableSchema>(tableName: string): Table<TableSchema> {
        if (this._pool === null) {
            throw new Error('no connection initialized');
        }
        return new Table<TableSchema>(tableName, this._pool);
    }
}

async function main() {
    const musqrat = new Musqrat();
    musqrat.connect({
        host: 'localhost',
        user: 'test',
        password: 'password',
        database: 'world'
    });

    type CountrySchema = {
        name: string;
    }

    const Country = musqrat.initTable<CountrySchema>('Country');

    console.log(Country.select('name').where('name', '=', 'Aruba\'; Select * FROM Country;').query);
    const results = await Country.select('name').where('name', '=', 'Aruba').exec()
    console.log(results);
    console.log(results[0].name);
}
main();



/*

What we want the code to look like:

import musqrat from 'musqrat';

type SomeTableSchema = {
    id: number;
    description: string;
}

const SomeTable: Table<SomeTableSchema> = musqrat.initTable<SomeTableSchema>('SomeTable');

const results = SomeTable.select(...).exec();

*/