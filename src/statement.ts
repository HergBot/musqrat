/*
TODO:
    - Bugs
        - Group by can't be called in a 'logical' (to me) order. Where is usually first, group by isn't on QueryStatment
    - Improvements
        - Don't allow duplicates on SELECT statement fields
    - Options to calls
    - Advanced uses
        - Unions
        - Sub queries
        - Function calls/stored procs?
*/

import { IDbConnection } from './connection';

import Table from "./table";
import { AnyKeyInArray, OptionalMulti, prepOptionalMulti } from "./utilities";

export type Order = 'ASC' | 'DESC';

export type WhereOp = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'IN' | 'IS' | 'IS NOT';
export type WhereChain = 'OR' | 'AND';

export type WhereClause<Schema> = {
    [K in keyof Schema]: {
        field: K;
        operator: 'IN',
        value: Schema[K][]
    } | {
        field: K;
        operator: 'IS' | 'IS NOT',
        value: null
    } | {
        field: K;
        operator: Exclude<WhereOp, 'IN' | 'IS' | 'IS NOT'>,
        value: Schema[K]
    }
}[keyof Schema];

export type AggregationCondition<Schema> = WhereClause<Schema> | WhereAggregation<Schema>;

export type WhereAggregation<Schema> = {
    [Chain in WhereChain]?: [AggregationCondition<Schema>, AggregationCondition<Schema>, ...AggregationCondition<Schema>[]]
}

export type QueryVariable<T> = T[keyof T] | T[keyof T][] | null;

// Can we add another type that is a Tuple or whatever to have an option for less verbose syntax? i.e. ['tableId', 5]
export type SetClause<Schema> = {
    [K in keyof Schema]: {
        field: K;
        value: Schema[K]
    }
}[keyof Schema];

class BaseStatement<SchemaType> {
    private _query: string;
    private _variables: Array<QueryVariable<SchemaType>>;
    private _dbConnection: IDbConnection | undefined;

    constructor(connection?: IDbConnection) {
        this._query = '';
        this._variables = [];
        this._dbConnection = connection;
    }

    get query(): string {
        return this._query;
    }

    get variables(): Array<QueryVariable<SchemaType>> {
        return this._variables;
    }

    protected append(queryText: string, variables: Array<QueryVariable<SchemaType>> = []): void {
        this._query = this._query === '' ? queryText : `${this._query} ${queryText}`;
        this._variables = [...this._variables, ...variables];
    }
    
    public async exec(): Promise<SchemaType[]> {
        if (this._dbConnection === undefined) {
            throw new Error('Database not connected');
        }

        const [rows, fields] = await this._dbConnection.execute(this._query, this._variables);
        console.log(rows, fields);
        return rows as SchemaType[];
    }
}

class QueryStatement<SchemaType> extends BaseStatement<SchemaType> {
    constructor(connection?: IDbConnection) {
        super(connection)
    }

    public limit(amount: number): QueryStatement<SchemaType> {
        this.append(`LIMIT ${amount}`);
        return this;
    }

    public orderBy(column: keyof SchemaType, order: Order = 'ASC'): QueryStatement<SchemaType> {
        this.append(`ORDER BY ${column} ${order}`);
        return this;
    }
    
    public where(field: keyof SchemaType, operator: Extract<WhereOp, 'IN'>, value: SchemaType[keyof SchemaType][]): QueryStatement<SchemaType>
    public where(field: keyof SchemaType, operator: Extract<WhereOp, 'IS' | 'IS NOT'>, value: null): QueryStatement<SchemaType>
    public where(field: keyof SchemaType, operator: Exclude<WhereOp, 'IN' | 'IS' | 'IS NOT'>, value: SchemaType[keyof SchemaType]): QueryStatement<SchemaType> 
    public where(aggregation: WhereAggregation<SchemaType>): QueryStatement<SchemaType>
    public where(agg: keyof SchemaType | WhereAggregation<SchemaType>, operator?: WhereOp, value?: SchemaType[keyof SchemaType] | SchemaType[keyof SchemaType][] | null) {
        const [query, variables] = operator && value
            ? this.constructClause({field: agg as keyof SchemaType, operator, value} as WhereClause<SchemaType>)
            : this.constructAggregation(agg as WhereAggregation<SchemaType>);
        this.append(`WHERE ${query}`, variables);
        return this;
        /*if (operator && value) {
            this.append(`WHERE ${this.constructClause({field: agg as keyof SchemaType, operator, value} as WhereClause<SchemaType>)}`);
            return this;
        }

        this.append(`WHERE ${this.constructAggregation(agg as WhereAggregation<SchemaType>)}`);
        return this;*/
    }

    private constructAggregation(aggregation: WhereAggregation<SchemaType>): [string, Array<QueryVariable<SchemaType>>] {
        const variables: Array<QueryVariable<SchemaType>> = [];
        const agg = Object.keys(aggregation).map(chain => {
            return aggregation[chain as WhereChain]?.map(condition => {
                if ((condition as WhereClause<SchemaType>).field !== undefined) {
                    const [query, vars] = this.constructClause((condition as WhereClause<SchemaType>));
                    variables.push(...vars);
                    return query;
                }
                const [query, vars] = this.constructAggregation(condition as WhereAggregation<SchemaType>);
                variables.push(...vars);
                return query;
            }).join(` ${chain} `);
        }).join(' ');
        return [`(${agg})`, variables];
    }

    private constructClause(clause: WhereClause<SchemaType>): [string, Array<QueryVariable<SchemaType>>] {
        return [`${clause.field} ${clause.operator} ?`, [clause.value]];
    }
}

class SelectStatement<SchemaType, JoinSchemas extends any[] = never[]> extends QueryStatement<SchemaType> {
    constructor(tableName: string, fields: (keyof SchemaType | AnyKeyInArray<JoinSchemas>[number])[] = [], connection?: IDbConnection) {
        super(connection);
        const fieldString = fields.length === 0 ? '*' : fields.join(', ');
        this.append(`SELECT ${fieldString} FROM ${tableName}`);
    }

    // Can we add an overload here that accepts just 1 parameter that is a key on both types and uses the USING syntax?
    innerJoin<JoinSchema extends JoinSchemas[number]>(foreignTable: Table<JoinSchema>, foreignColumn: keyof JoinSchema, localColumn: keyof SchemaType): SelectStatement<SchemaType, JoinSchemas> {
        this.append(`INNER JOIN ${foreignTable.name} ON ${foreignColumn} = ${localColumn}`);
        return this;
    }

    groupBy(column: keyof SchemaType): SelectStatement<SchemaType, JoinSchemas> {
        this.append(`GROUP BY ${column}`);
        return this;
    }
};

class UpdateStatement<SchemaType> extends QueryStatement<SchemaType> {
    constructor(tableName: string, updates: OptionalMulti<SetClause<SchemaType>>, connection?: IDbConnection) {
        super(connection);
        updates = prepOptionalMulti(updates);
        this.append(`UPDATE ${tableName}`);
        const variables: Array<QueryVariable<SchemaType>> = [];
        const setString = updates.map(update => {
            variables.push(update.value);
            return `${update.field} = ?`;
        }).join(', ');
        this.append(`SET ${setString}`, variables);
    }
};

class DeleteStatement<SchemaType> extends QueryStatement<SchemaType> {
    constructor(tableName: string, connection?: IDbConnection) {
        super(connection);
        this.append(`DELETE FROM ${tableName}`);
    }
};

class InsertStatement<SchemaType, PrimaryKey extends keyof SchemaType = never> extends BaseStatement<SchemaType> {
    // We need to sort the keys and get everything in the same order. Object.values returns in the order of assignment
    constructor(tableName: string, values: OptionalMulti<Omit<SchemaType, PrimaryKey>>, connection?: IDbConnection) {
        super(connection);
        values = prepOptionalMulti(values);
        const columns = Object.keys(values[0]);
        const variables: Array<QueryVariable<SchemaType>> = [];
        const valueStrings = values.map(value => {
            const queryMarkers = Object.values(value).map(value => {
                variables.push(value as QueryVariable<SchemaType>);
                return '?';
            }).join(', ')
            return `(${queryMarkers})`;
        })
        this.append(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${valueStrings.join(', ')}`, variables);
    }
};

export {
    QueryStatement,
    SelectStatement,
    UpdateStatement,
    DeleteStatement,
    InsertStatement
}