import mysql from "mysql2/promise";

/**
 * An interface that can be used to execute queries. Compatible with the mysql2
 * Pool type.
 */
export interface IDbConnection {
  execute: (query: string, values: any) => Promise<[any[], any[]]>;
}

class DbConnection implements IDbConnection {
  private _pool: mysql.Pool | null;

  constructor() {
    this._pool = null;
  }

  public get connected(): boolean {
    return this._pool !== null;
  }

  public connect(config: mysql.PoolOptions): void {
    this._pool = mysql.createPool(config);
  }

  public async disconnect(): Promise<void> {
    if (this._pool !== null) {
      await this._pool.end();
      this._pool = null;
    }
  }

  public execute(query: string, values: any): Promise<[any[], any[]]> {
    if (this._pool === null) {
      throw new Error("Database not connected");
    }
    return this._pool.execute(query, values);
  }
}

export default DbConnection;
