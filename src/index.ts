import mysql from "mysql2/promise";

import DbConnection from "./connection";
import Table from "./table";

/**
 * The root Musqrat class that handles the MySQL connection and initializing connected components.
 */
class Musqrat {
  private _connection: DbConnection;
  constructor() {
    this._connection = new DbConnection();
  }

  /**
   * Determines if the database is currently connected or not.
   */
  public get connected(): boolean {
    return this._connection.connected;
  }

  /**
   * Creates the connection to the database.
   * @param config The MySQL pool connection options.
   */
  public connect(config: mysql.PoolOptions): void {
    this._connection.connect(config);
  }

  /**
   * Disconnects from the database.
   */
  public async disconnect(): Promise<void> {
    this._connection.disconnect();
  }

  /**
   * Initializes a table with the database connection.
   * @param tableName The table name.
   * @returns The initialized table object.
   */
  public initTable<TableSchema, PrimaryKey extends keyof TableSchema = never>(
    tableName: string
  ): Table<TableSchema, PrimaryKey> {
    return new Table<TableSchema, PrimaryKey>(tableName, this._connection);
  }
}

export default new Musqrat();

export * from "./connection";
export * from "./statement";
export * from "./table";
export * from "./testing";
export * from "./utilities";
