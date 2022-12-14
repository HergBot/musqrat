import { IDbConnection } from "./connection";

import Table from "./table";
import {
    AnyKeyInArray,
    OptionalMulti,
    UnionToIntersection,
    prepOptionalMulti,
} from "./utilities";

// All allowed order by directions
export type Order = "ASC" | "DESC";

// All allowed where operations
export type WhereOp =
    | "="
    | "!="
    | ">"
    | ">="
    | "<"
    | "<="
    | "IN"
    | "IS"
    | "IS NOT";
export type WhereChain = "OR" | "AND";

// A constructed where clause
export type WhereClause<Schema> = {
    [K in keyof Schema]:  // When the operator used is 'IN' the value must be an array
        | {
              field: K;
              operator: "IN";
              value: Schema[K][];
          }
        // When the operator used is 'IS' or 'IS NOT' the value must be null
        | {
              field: K;
              operator: "IS" | "IS NOT";
              value: null;
          }
        // For all other operators the value must be a single value
        | {
              field: K;
              operator: Exclude<WhereOp, "IN" | "IS" | "IS NOT">;
              value: Schema[K];
          };
}[keyof Schema];

// Aggregation conditions. Can be where clauses or nested aggregations.
export type AggregationCondition<Schema> =
    | WhereClause<Schema>
    | WhereAggregation<Schema>;

// Aggregation shape. An aggregation must have at least 2 conditions.
export type WhereAggregation<Schema> = {
    [Chain in WhereChain]?: [
        AggregationCondition<Schema>,
        AggregationCondition<Schema>,
        ...AggregationCondition<Schema>[]
    ];
};

// Possible types for a query variable (single value, array, or null)
export type QueryVariable<T> = T[keyof T] | T[keyof T][] | null;

// Can we add another type that is a Tuple or whatever to have an option for less verbose syntax? i.e. ['tableId', 5]
export type SetClause<Schema, PrimaryKey extends keyof Schema = never> = {
    [K in Exclude<keyof Schema, PrimaryKey>]: {
        field: K;
        value: Schema[K];
    };
}[Exclude<keyof Schema, PrimaryKey>];

export type InsertValue<Schema, PrimaryKey extends keyof Schema = never> = Omit<
    Schema,
    PrimaryKey
>;

export type WriteMetaData = {
    fieldCount: number;
    affectedRows: number;
    insertId: number;
    info: string;
    serverStatus: number;
    warningStatus: number;
    changedRows?: number;
};

/**
 * The lowest level of constructing/executing a statement.
 */
class BaseStatement<SchemaType, ReturnType> {
    private _query: string;
    private _variables: Array<QueryVariable<SchemaType>>;
    private _dbConnection: IDbConnection | undefined;

    constructor(connection?: IDbConnection) {
        this._query = "";
        this._variables = [];
        this._dbConnection = connection;
    }

    /**
     * The full prepared query.
     */
    get query(): string {
        return this._query;
    }

    /**
     * The variables that will be applied to the prepared statement in the order they will be applied.
     */
    get variables(): Array<QueryVariable<SchemaType>> {
        return this._variables;
    }

    /**
     * Appends to the query string and variable array.
     * @param queryText Prepared text to append to the query.
     * @param variables Variable values to append to the array in the order they will be applied.
     */
    protected append(
        queryText: string,
        variables: Array<QueryVariable<SchemaType>> = []
    ): void {
        this._query =
            this._query === "" ? queryText : `${this._query} ${queryText}`;
        this._variables = [...this._variables, ...variables];
    }

    /**
     * Executes the query.
     * @throws When the database connection is not given.
     * @returns The rows returned if any.
     */
    public async exec(): Promise<ReturnType> {
        if (this._dbConnection === undefined) {
            throw new Error("Database not connected");
        }

        const [rows, fields] = await this._dbConnection.execute(
            this._query,
            this._variables
        );
        return Array.isArray(rows) ? rows as unknown as ReturnType : rows as ReturnType;
    }
}

/**
 * Holds some common query filters that are used with multiple different statement types.
 */
class QueryStatement<SchemaType, ReturnType> extends BaseStatement<SchemaType, ReturnType> {
    constructor(connection?: IDbConnection) {
        super(connection);
    }

    /**
     * Adds a limit clause to the query.
     * @param amount The limit amount.
     * @returns The full statement with the added limit.
     */
    public limit(amount: number): QueryStatement<SchemaType, ReturnType> {
        this.append(`LIMIT ${amount}`);
        return this;
    }

    /**
     * Adds an order by clause to the query.
     * @param column The column to order by.
     * @param order The direction to order in (defaults ASC).
     * @returns The full statement with the added order by.
     */
    public orderBy(
        column: keyof SchemaType,
        order: Order = "ASC"
    ): QueryStatement<SchemaType, ReturnType> {
        this.append(`ORDER BY ${column.toString()} ${order}`);
        return this;
    }

    /**
     * Adds a single condition where clause to the query.
     * @param field The column name.
     * @param operator The operator.
     * @param value The value.
     * @returns The full statement with the added where.
     */
    public where(
        field: keyof SchemaType,
        operator: Extract<WhereOp, "IN">,
        value: SchemaType[keyof SchemaType][]
    ): QueryStatement<SchemaType, ReturnType>;
    public where(
        field: keyof SchemaType,
        operator: Extract<WhereOp, "IS" | "IS NOT">,
        value: null
    ): QueryStatement<SchemaType, ReturnType>;
    public where(
        field: keyof SchemaType,
        operator: Exclude<WhereOp, "IN" | "IS" | "IS NOT">,
        value: SchemaType[keyof SchemaType]
    ): QueryStatement<SchemaType, ReturnType>;
    /**
     * Adds a multiple condition where clause to the query.
     * @param aggregation An aggregation object with as many levels as necessary.
     * @returns The full statement with the added where.
     */
    public where(
        aggregation: WhereAggregation<SchemaType>
    ): QueryStatement<SchemaType, ReturnType>;
    public where(
        agg: keyof SchemaType | WhereAggregation<SchemaType>,
        operator?: WhereOp,
        value?:
            | SchemaType[keyof SchemaType]
            | SchemaType[keyof SchemaType][]
            | null
    ) {
        const [query, variables] =
            operator && value
                ? this.constructClause({
                      field: agg as keyof SchemaType,
                      operator,
                      value,
                  } as WhereClause<SchemaType>)
                : this.constructAggregation(
                      agg as WhereAggregation<SchemaType>
                  );
        this.append(`WHERE ${query}`, variables);
        return this;
    }

    /**
     * Turns an aggregation object into a string.
     * @param aggregation The aggregation object.
     * @returns A string to be applied to the query. Always wrapped in brackets.
     */
    private constructAggregation(
        aggregation: WhereAggregation<SchemaType>
    ): [string, Array<QueryVariable<SchemaType>>] {
        const variables: Array<QueryVariable<SchemaType>> = [];
        const agg = Object.keys(aggregation)
            .map((chain) => {
                chain = chain as WhereChain;
                return aggregation[chain as WhereChain]
                    ?.map((condition) => {
                        const [query, vars] =
                            (condition as WhereClause<SchemaType>).field !==
                            undefined
                                ? this.constructClause(
                                      condition as WhereClause<SchemaType>
                                  )
                                : this.constructAggregation(
                                      condition as WhereAggregation<SchemaType>
                                  );
                        variables.push(...vars);
                        return query;
                    })
                    .join(` ${chain} `);
            })
            .join(" ");
        return [`(${agg})`, variables];
    }

    /**
     * Turns a single where clause into a string.
     * @param clause The clause.
     * @returns The string form to be applied to the query or bigger aggregation.
     */
    private constructClause(
        clause: WhereClause<SchemaType>
    ): [string, Array<QueryVariable<SchemaType>>] {
        return [`${clause.field.toString()} ${clause.operator} ?`, [clause.value]];
    }
}

class SelectStatement<
    SchemaType,
    JoinSchemas extends any[] = never[]
> extends QueryStatement<
    SchemaType & UnionToIntersection<JoinSchemas[number]>, (SchemaType & UnionToIntersection<JoinSchemas[number]>)[]
> {
    constructor(
        tableName: string,
        fields: (keyof (SchemaType &
            UnionToIntersection<JoinSchemas[number]>))[] = [],
        connection?: IDbConnection
    ) {
        super(connection);
        const fieldString = fields.length === 0 ? "*" : fields.join(", ");
        this.append(`SELECT ${fieldString} FROM ${tableName}`);
    }

    /**
     * Adds an inner join to the query.
     * @param foreignTable The foreign table to join on.
     * @param foreignColumn The foreign column to join on.
     * @param localColumn The local column to join to.
     * @returns The full statement with the inner join applied.
     */
    innerJoin<JoinSchema extends JoinSchemas[number]>(
        foreignTable: Table<JoinSchema>,
        foreignColumn: keyof JoinSchema,
        localColumn: keyof SchemaType
    ): SelectStatement<SchemaType, JoinSchemas> {
        this.append(
            `INNER JOIN ${foreignTable.name} ON ${foreignColumn.toString()} = ${localColumn.toString()}`
        );
        return this;
    }

    /**
     * Adds a group by clause to the query.
     * @param column The column to group by.
     * @returns The full statement with the group by applied.
     */
    groupBy(
        column: keyof (SchemaType & UnionToIntersection<JoinSchemas[number]>)
    ): SelectStatement<SchemaType, JoinSchemas> {
        this.append(`GROUP BY ${column.toString()}`);
        return this;
    }

    public async exec(): Promise<(SchemaType & UnionToIntersection<JoinSchemas[number]>)[]> {
        return await super.exec() as (SchemaType & UnionToIntersection<JoinSchemas[number]>)[];
    }
}

class UpdateStatement<
    SchemaType,
    PrimaryKey extends keyof SchemaType = never
> extends QueryStatement<SchemaType, WriteMetaData> {
    constructor(
        tableName: string,
        updates: OptionalMulti<SetClause<SchemaType, PrimaryKey>>,
        connection?: IDbConnection
    ) {
        super(connection);
        updates = prepOptionalMulti(updates);
        this.append(`UPDATE ${tableName}`);
        const variables: Array<QueryVariable<SchemaType>> = [];
        const setString = updates
            .map((update) => {
                variables.push(update.value);
                return `${update.field.toString()} = ?`;
            })
            .join(", ");
        this.append(`SET ${setString}`, variables);
    }

    public async exec(): Promise<WriteMetaData> {
        return await super.exec() as WriteMetaData;
    }
}

class DeleteStatement<SchemaType> extends QueryStatement<SchemaType, WriteMetaData> {
    constructor(tableName: string, connection?: IDbConnection) {
        super(connection);
        this.append(`DELETE FROM ${tableName}`);
    }

    public async exec(): Promise<WriteMetaData> {
        return await super.exec() as WriteMetaData;
    }
}

class InsertStatement<
    SchemaType,
    PrimaryKey extends keyof SchemaType = never
> extends BaseStatement<SchemaType, WriteMetaData> {
    // We need to sort the keys and get everything in the same order. Object.values returns in the order of assignment
    constructor(
        tableName: string,
        values: OptionalMulti<InsertValue<SchemaType, PrimaryKey>>,
        connection?: IDbConnection
    ) {
        super(connection);
        values = prepOptionalMulti(values);
        const columns = Object.keys(values[0]);
        const variables: Array<QueryVariable<SchemaType>> = [];
        const valueStrings = values.map((value) => {
            const queryMarkers = Object.values(value)
                .map((value) => {
                    variables.push(value as QueryVariable<SchemaType>);
                    return "?";
                })
                .join(", ");
            return `(${queryMarkers})`;
        });
        this.append(
            `INSERT INTO ${tableName} (${columns.join(
                ", "
            )}) VALUES ${valueStrings.join(", ")}`,
            variables
        );
    }

    public async exec(): Promise<WriteMetaData> {
        return await super.exec() as WriteMetaData;
    }
}

export {
    QueryStatement,
    SelectStatement,
    UpdateStatement,
    DeleteStatement,
    InsertStatement,
};
