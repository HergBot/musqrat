# musqrat

A lightweight, strongly typed wrapper for using MySQL in Node.JS.

Inspired by using `mongoose`, I wanted something with a similar chaining behaviour for MySQL plus the benefits of TypeScript while building queries.

## Dependencies

-   mysql2
-   TypeScript

## Currently Supports

-   [Connecting to a MySQL database](#connecting-to-a-mysql-database)
-   [Define tables using a TypeScript type/interface](#defining-a-table)
-   Basic Table Operations
    -   [DELETE](#deleting)
        -   [LIMIT](#limit)
        -   [ORDER BY](#order-by)
        -   [WHERE](#where)
    -   [INSERT](#inserting)
    -   [SELECT](#selecting)
        -   [GROUP BY](#group-by)
        -   [INNER JOIN](#inner-join)
        -   [LIMIT](#limit)
        -   [ORDER BY](#order-by)
        -   [WHERE](#where)
    -   [UPDATE](#updating)
        -   [LIMIT](#limit)
        -   [ORDER BY](#order-by)
        -   [WHERE](#where)

## Examples

#### Connecting to a MySQL database

```js
import musqrat from "musqrat";

// Uses the mysql.Pool type: https://github.com/mysqljs/mysql#pool-options
musqrat.connect({
    username: "username",
    password: "password",
    host: "localhost",
    database: "testDB",
});

if (musqrat.connected) {
    console.log("Woohoo!");
}

await musqrat.disconnect();
```

#### Defining a table

```js
interface TableSchema = {
    tableId: number;
    column: string;
    nullableColumn?: string;
}

const Table = musqrat.initTable<TableSchema>('TableName');
```

#### Building Queries vs Executing Queries

```js
// Each query operation can be used to build a prepared statement or execute against the database if the
// connection object is given.
console.log(Table.delete().query);
await Table.delete().exec();
```

#### Deleting

```js
// Deletes everything, no conditions. Use limit/orderBy/where to be more specific.
await Table.delete().exec();
```

#### Inserting

```js
// Insert accepts a single object or array of objects.
// INSERT INTO TableName (tableId, column) VALUES (1, 'value');
await Table.insert({tableId: 1, column: 'value'}).exec();
// INSERT INTO TableName (tableId, column) VALUES (1, 'value'), (2, 'another');
await Table.insert([{tableId: 1, column: 'value'}, {tableId: 2, column: 'another'}]).exec();

// You can also identify primary keys when creating the table that can be excluded from insertion
// (i.e. if they are AUTO_INCREMENT)
const Table = musqrat.initTable<TableSchema, 'tableId'>('TableName');
// Now this is invalid
await Table.insert({tableId: 1, column: 'value'}).exec();
// This is valid
await Table.insert({column: 'value'}).exec();
```

#### Selecting

```js
// SELECT tableId, column FROM TableName;
await Table.select("tableId", "column").exec();

// SELECT * FROM TableName;
await Table.select().exec();
```

#### Updating

```js
// Update accepts a single object or array of objects
// UPDATE TableName SET column = 'new value';
await Table.update({ field: "column", value: "new value" }).exec();

// UPDATE TableName SET column = 'new value', nullableColumn = NULL;
await Table.update([
    { field: "column", value: "new value" },
    { field: "nullableColumn", value: null },
]).exec();
```

#### Group By

```js
// Available on select only
// SELECT * FROM TableName GROUP BY column;
await Table.select().groupBy("column").exec();
```

#### Inner Join

```js
// Available on select only
interface JoinSchema = {
    joinId: number;
    tableId: number;
}
// SELECT tableId, joinId FROM TableName INNER JOIN JoinTable ON tableId = tableId;
await Table.select<[JoinSchema]>('tableId', 'joinId').innerJoin('JoinTable', 'tableId', 'tableId').exec();
```

#### Limit

```js
// Available on select, update, delete
// SELECT * FROM TableName LIMIT 1;
await Table.select().limit(1).exec();
```

#### Order By

```js
// Available on select, update, delete
// SELECT * FROM TableName ORDER BY column ASC;
await Table.select().orderBy("column").exec();

// SELECT * FROM TableName ORDER BY column DESC;
await Table.select().orderBy("column", "DESC").exec();
```

#### Where

```js
// Available on select, update, delete
// SELECT * FROM TableName WHERE tableId IN (1, 2, 3);
await Table.select().where("tableId", "in", [1, 2, 3]).exec();

// UPDATE TableName SET nullableColumn = NULL WHERE (column = 'specific' AND nullableColumn IS NOT NULL);
await Table.update({ field: "nullableColumn", value: null })
    .where({
        AND: [
            { field: "column", operator: "=", value: "specific" },
            { field: "nullableColumn", operator: "IS NOT", value: null },
        ],
    })
    .exec();

// WHERE conditions can be built using either a single where condition or an 'aggregation'
// which is an object like you see in the second example that looks like this: {AND?: <>, OR?: <>}
// You can nest those as far down as you need to.
```

## TODO

-   Bugs
    -   `groupBy` can't be called in a 'logical' (to me) order. `where` is usually first, `groupBy` isn't on `QueryStatment`
-   Improvements
    -   Don't allow duplicates on `select` statement fields
-   Options to calls
-   Advanced uses
    -   Views
    -   Unions
    -   Sub queries
    -   Function calls/stored procs?
