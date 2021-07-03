import Table from "./table";

class Statement {
    query: string
}

interface ExecutableStatement {
    exec: () => Promise<void>
}

interface PrecisionStatement<SchemaType> {
    where: () => ExecutableStatement;
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

class SelectStatement<SchemaType> extends Statement implements ExecutableStatement, PrecisionStatement<SchemaType>  {
    private _query: string;

    constructor(tableName: string, fields: (keyof SchemaType)[] = []) {
        const fieldString = fields.length === 0 ? '*' : fields.join(', ');
        this._query = `SELECT ${fieldString} FROM ${tableName}`;
    }

    get query(): string {
        return this._query;
    }

    innerJoin(): SelectStatement<SchemaType> {
        return this;
    }

    where(): SelectStatement<SchemaType> {
        return this;
    }

    orderBy(): SelectStatement<SchemaType> {
        return this;
    }

    exec(): Promise<void> {
        return Promise.resolve();
    }
};

class UpdateStatement<SchemaType> extends Statement {
    constructor(tableName: string) {
        super(`UPDATE ${tableName}`);
    }
};

class DeleteStatement<SchemaType> implements ExecutableStatement, PrecisionStatement<SchemaType>, Statement {
    private _query: string;

    constructor(tableName: string) {
        this._query = `DELETE FROM ${tableName}`;
    }

    get query(): string {
        return this._query;
    }

    where(): DeleteStatement<SchemaType> {
        return this;
    }

    exec(): Promise<void> {
        return Promise.resolve();
    }
};

export {
    SelectStatement,
    UpdateStatement,
    DeleteStatement
}