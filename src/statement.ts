/*
TODO:
    - Execute query
        - Safe guard params?
        - Scrub query?
        - End query with ;?
    - Options to calls
    - Advanced uses
        - Unions
        - Sub queries
        - Function calls/stored procs?
*/

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

// Can we add another type that is a Tuple or whatever to have an option for less verbose syntax? i.e. ['tableId', 5]
export type SetClause<Schema> = {
    [K in keyof Schema]: {
        field: K;
        value: Schema[K]
    }
}[keyof Schema];

interface IExecutableStatement {
    exec: () => Promise<void>
}

class BaseStatement<SchemaType> {
    private _query: string;

    constructor() {
        this._query = '';
    }

    get query(): string {
        return this._query;
    }

    protected append(queryText: string): void {
        this._query = this._query === '' ? queryText : `${this._query} ${queryText}`;
    }

    protected formatValue<K extends keyof SchemaType>(value: SchemaType[K] | SchemaType[K][] | null): string {
        if (value === null || value === undefined) {
            return 'NULL';
        } else if (Array.isArray(value)) {
            const values = value.map(val => this.formatValue(val));
            return `(${values.join(', ')})`;
        }

        switch(typeof value) {
            case 'boolean':
                return value === true ? 'TRUE' : "FALSE";
            case 'string':
                return `'${value}'`;
            default:
                return `${value}`;
        }
    }
}

class QueryStatement<SchemaType> extends BaseStatement<SchemaType> {
    constructor() {
        super()
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
        if (operator && value) {
            this.append(`WHERE ${this.constructClause({field: agg as keyof SchemaType, operator, value} as WhereClause<SchemaType>)}`);
            return this;
        }

        this.append(`WHERE ${this.constructAggregation(agg as WhereAggregation<SchemaType>)}`);
        return this;
    }

    private constructAggregation(aggregation: WhereAggregation<SchemaType>): string {
        const agg = Object.keys(aggregation).map(chain => {
            return aggregation[chain as WhereChain]?.map(condition => {
                if ((condition as WhereClause<SchemaType>).field !== undefined) {
                    return this.constructClause((condition as WhereClause<SchemaType>));
                }
                return this.constructAggregation(condition as WhereAggregation<SchemaType>);
            }).join(` ${chain} `);
        }).join(' ');
        return `(${agg})`;
    }

    private constructClause(clause: WhereClause<SchemaType>): string {
        return `${clause.field} ${clause.operator} ${this.formatValue(clause.value)}`;
    }
}

class SelectStatement<SchemaType, JoinSchemas extends any[] = never[]> extends QueryStatement<SchemaType> implements IExecutableStatement {
    constructor(tableName: string, fields: (keyof SchemaType | AnyKeyInArray<JoinSchemas>[number])[] = []) {
        super();
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

    exec(): Promise<void> {
        return Promise.resolve();
    }
};

class UpdateStatement<SchemaType> extends QueryStatement<SchemaType> implements IExecutableStatement {
    constructor(tableName: string, updates: OptionalMulti<SetClause<SchemaType>>) {
        super();
        updates = prepOptionalMulti(updates);
        this.append(`UPDATE ${tableName}`);
        const setString = updates.map(update => {
            return `${update.field} = ${this.formatValue(update.value)}`;
        }).join(', ');
        this.append(`SET ${setString}`);
    }

    exec(): Promise<void> {
        return Promise.resolve();
    }
};

class DeleteStatement<SchemaType> extends QueryStatement<SchemaType> implements IExecutableStatement {
    constructor(tableName: string) {
        super();
        this.append(`DELETE FROM ${tableName}`);
    }

    exec(): Promise<void> {
        return Promise.resolve();
    }
};

class InsertStatement<SchemaType, PrimaryKey extends keyof SchemaType = never> extends BaseStatement<SchemaType> implements IExecutableStatement {
    // We need to sort the keys and get everything in the same order. Object.values returns in the order of assignment
    constructor(tableName: string, values: OptionalMulti<Omit<SchemaType, PrimaryKey>>) {
        super();
        values = prepOptionalMulti(values);
        const columns = Object.keys(values[0]);
        const valueStrings = values.map(value => {
            return `(${Object.values(value).map(value => this.formatValue(value as SchemaType[keyof SchemaType])).join(', ')})`;
        })
        this.append(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${valueStrings.join(', ')}`);
    }

    exec(): Promise<void> {
        return Promise.resolve();
    }
};

export {
    QueryStatement,
    SelectStatement,
    UpdateStatement,
    DeleteStatement,
    InsertStatement
}