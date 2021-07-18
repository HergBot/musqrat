import Table from "./table";

export type Nullable<T> = T | null;

// Can we limit these based on the field type? i.e. boolean only has = and !=
// IN has to be an array
// IS has to be null/not null
type WhereOp = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'IN' | 'IS' | 'IS NOT';
type WhereChain = 'OR' | 'AND';

// WHERE Field OP Value
// WHERE Field OP Value OR Field2 OP Value2
// WHERE Field OP Value AND Field2 OP Value2
// WHERE Field OP Value AND Field2 OP Value2 OR Field3 OP Value2
// WHERE (Field OP Value AND Field2 OP Value2) OR Field3 OP Value2

// .where('Field', '=', 1)
// .where({'})

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

class Statement<SchemaType> {
    private _query: string;

    constructor() {
        this._query = '';
    }

    get query(): string {
        return this._query;
    }
    
    public where(field: keyof SchemaType, operator: Extract<WhereOp, 'IN'>, value: SchemaType[keyof SchemaType][]): Statement<SchemaType>
    public where(field: keyof SchemaType, operator: Extract<WhereOp, 'IS' | 'IS NOT'>, value: null): Statement<SchemaType>
    public where(field: keyof SchemaType, operator: Exclude<WhereOp, 'IN' | 'IS' | 'IS NOT'>, value: SchemaType[keyof SchemaType]): Statement<SchemaType> 
    public where(aggregation: WhereAggregation<SchemaType>): Statement<SchemaType>
    public where(agg: keyof SchemaType | WhereAggregation<SchemaType>, operator?: WhereOp, value?: SchemaType[keyof SchemaType] | SchemaType[keyof SchemaType][] | null) {
        if (operator && value) {
            this.append(`WHERE ${this.constructClause({field: agg as keyof SchemaType, operator, value} as WhereClause<SchemaType>)}`);
            return this;
        }

        this.append(`WHERE ${this.constructAggregation(agg as WhereAggregation<SchemaType>)}`);
        return this;
    }

    protected append(queryText: string): void {
        this._query = this._query === '' ? queryText : `${this._query} ${queryText}`;
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

    private formatValue<K extends keyof SchemaType>(value: SchemaType[K] | SchemaType[K][] | null): string {
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

interface IExecutableStatement {
    exec: () => Promise<void>
}

interface IPrecisionStatement<SchemaType> {
    where: () => IExecutableStatement;
}

/*interface SelectStatement<SchemaType> extends ExecutableStatement, PrecisionStatement<SchemaType>, Statement {
    innerJoin: () => SelectStatement<SchemaType>;
    orderBy: () => SelectStatement<SchemaType>;
    groupBy: () => SelectStatement<SchemaType>;
    limit: () => SelectStatement<SchemaType>;
}*/

/*class Statement {
    private _sql: string;

    constructor(baseStatement: string) { 
        this._sql = baseStatement;
    }

    get raw() {
        return this._sql;
    }
};*/

class SelectStatement<SchemaType> extends Statement<SchemaType> implements IExecutableStatement {
    constructor(tableName: string, fields: (keyof SchemaType)[] = []) {
        super();
        const fieldString = fields.length === 0 ? '*' : fields.join(', ');
        this.append(`SELECT ${fieldString} FROM ${tableName}`);
    }

    innerJoin(): SelectStatement<SchemaType> {
        return this;
    }

    orderBy(): SelectStatement<SchemaType> {
        return this;
    }

    exec(): Promise<void> {
        return Promise.resolve();
    }
};

class UpdateStatement<SchemaType> extends Statement<SchemaType> implements IPrecisionStatement<SchemaType>, IExecutableStatement {
    constructor(tableName: string) {
        super();
        this.append(`UPDATE ${tableName}`);
    }

    where(): UpdateStatement<SchemaType> {
        return this;
    }

    exec(): Promise<void> {
        return Promise.resolve();
    }
};

class DeleteStatement<SchemaType> extends Statement<SchemaType> implements IExecutableStatement, IPrecisionStatement<SchemaType> {

    constructor(tableName: string) {
        super();
        this.append(`DELETE FROM ${tableName}`);
    }

    where(): DeleteStatement<SchemaType> {
        return this;
    }

    exec(): Promise<void> {
        return Promise.resolve();
    }
};

export {
    Statement,
    SelectStatement,
    UpdateStatement,
    DeleteStatement
}