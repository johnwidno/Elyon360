const { Sequelize } = require("sequelize");
require("dotenv").config({ path: "../.env" });

const sequelize = new Sequelize(
  process.env.DB_NAME || "elyon360",
  process.env.DB_USER || "elyon_user",
  process.env.DB_PASSWORD || "elyon_pass",
  { host: process.env.DB_HOST || "localhost", port: 5432, dialect: "postgres" }
);

async function check() {
  try {
    const results = await sequelize.query(
      `SELECT t1.constraint_name, t1.table_name, t1.column_name, t2.table_name as referenced_table_name, t2.column_name as referenced_column_name 
       FROM information_schema.key_column_usage t1 
       JOIN information_schema.constraint_column_usage t2 ON t1.constraint_name = t2.constraint_name 
       WHERE t1.table_name = 'audit_logs'`
    );
    console.log("Audit Logs Foreign Keys:");
    console.log(JSON.stringify(results[0], null, 2));
    process.exit(0);
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
}

check();
