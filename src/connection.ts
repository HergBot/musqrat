/**
 * An interface that can be used to execute queries. Compatible with the mysql2
 * Pool type.
 */
export interface IDbConnection {
    execute: (query: string, values: any) => Promise<[any[], any[]]>;
}
