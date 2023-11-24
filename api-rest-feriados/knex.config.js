const knex = require("knex")({
  client: "sqlite3",
  connection: {
    filename: "./holidays.sqlite",
  },
  pool: {
    afterCreate: (conn, cb) =>
      conn.run("PRAGMA foreign_keys = ON", (...args) => {
        console.log("Foreign key constraints activated");

        cb(...args);
      }),
  },
});

module.exports = {
  knex,
};
