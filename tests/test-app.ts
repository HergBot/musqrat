import musqrat from "../src/index";

// Set up:
// 1. Add new user to MySQL "musqrattestuser"
// 2. Add new database "musqrattest"
// 3. Add new table "TestTable"
/*
CREATE TABLE TestTable
(
    Test_Id INT NOT NULL AUTO_INCREMENT,
    Description VARCHAR(64) NOT NULL,
    Deactivated DATETIME DEFAULT NULL,
    PRIMARY KEY (Test_Id)
);
*/

const TEST_ENV = {
  USER: "musqrattestuser",
  PASSWORD: "musqrattestpassword",
  HOST: "localhost",
  DATABASE: "musqrattest",
  TABLE: "TestTable",
};

interface ITestTable {
  Test_Id: number;
  Description: string;
  Deactivated?: Date;
}

async function main() {
  console.log("musqrat test app");
  try {
    musqrat.connect({
      user: TEST_ENV.USER,
      password: TEST_ENV.PASSWORD,
      host: TEST_ENV.HOST,
      database: TEST_ENV.DATABASE,
    });
  } catch (err) {
    console.error("Error connecting to the database", "main");
    console.error(err.message);
    return;
  }

  const Table = musqrat.initTable<ITestTable, "Test_Id">(TEST_ENV.TABLE);

  // Insert
  let result: any = await Table.insert([
    { Description: "first test" },
    { Description: "second test" },
  ]).exec();
  console.log("\nInsert result:");
  console.log(JSON.stringify(result));

  // Select
  result = await Table.select("Test_Id", "Description", "Deactivated").exec();
  console.log("\nSelect result:");
  console.log(JSON.stringify(result));

  // Select with where
  const filtered = await Table.select("Test_Id")
    .where("Test_Id", "=", 1)
    .exec();
  console.log("Filtered Select result:");
  console.log(JSON.stringify(filtered));

  // Update
  result = await Table.update({
    field: "Description",
    value: "Final Value",
  }).exec();
  console.log("Update result:");
  console.log(JSON.stringify(result));

  // Select
  result = await Table.select("Test_Id", "Description", "Deactivated").exec();
  console.log("\nSelect result:");
  console.log(JSON.stringify(result));

  // Delete
  result = await Table.delete().exec();
  console.log("Delete result:");
  console.log(JSON.stringify(result));

  // Select
  result = await Table.select("Test_Id", "Description", "Deactivated").exec();
  console.log("\nSelect result:");
  console.log(JSON.stringify(result));

  return;
}

main();
