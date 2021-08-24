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

export default new Musqrat();
