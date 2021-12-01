import mysql from "mysql2/promise";

import Table from "./table";

/**
 * The root Musqrat class that handles the MySQL connection and initializing connected components.
 */
class Musqrat {
    private _pool: mysql.Pool | null;

    constructor() {
        this._pool = null;
    }

    /**
     * Determines if the database is currently connected or not.
     */
    public get connected(): boolean {
        return this._pool !== null;
    }

    /**
     * Creates the connection to the database.
     * @param config The MySQL pool connection options.
     */
    public connect(config: mysql.PoolOptions): void {
        this._pool = mysql.createPool(config);
    }

    /**
     * Disconnects from the database.
     */
    public async disconnect(): Promise<void> {
        if (this._pool !== null) {
            await this._pool.end();
            this._pool = null;
        }
    }

    /**
     * Initializes a table with the database connection.
     * @param tableName The table name.
     * @returns The initialized table object.
     */
    public initTable<TableSchema, PrimaryKey extends keyof TableSchema = never>(
        tableName: string
    ): Table<TableSchema, PrimaryKey> {
        return new Table<TableSchema, PrimaryKey>(tableName, this._pool || undefined);
    }
}

export default new Musqrat();
