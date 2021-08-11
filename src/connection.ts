export interface IDbConnection {
    execute: (query: string, values: any) => Promise<[any[], any[]]>;
};