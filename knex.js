const knex = require("knex");

const user = process.env.USER || "postgres";
const db = knex({
  client: "pg",
  connection:
    process.env.DATABASE_URL ||
    `postgres://${user}@127.0.0.1:5432/authentication`,
  searchPath: "public"
});

module.exports = db;
