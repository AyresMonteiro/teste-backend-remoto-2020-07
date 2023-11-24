const fs = require("fs");

const { knex } = require("./knex.config");

const readCSV = async (path) => {
  const csv = fs.readFileSync(path, "utf8");

  const allLines = csv.split("\n").slice(1);

  for (let i = 0; i < allLines.length; i += 500) {
    const lines = allLines.slice(i, i + 500);

    const dataPack = lines.map((line) => {
      const [code, name] = line.split(",");

      return {
        code,
        name,
        carnaval: false,
        corpus_christi: false,
        state: code.substring(0, 2),
      };
    });

    await knex.batchInsert(
      "areas",
      dataPack.filter((v) => !!v.code && !!v.name)
    );
  }
};

async function startDatabase() {
  await knex.schema.createTableIfNotExists("areas", function (table) {
    table.string("code");
    table.string("name");
    table.string("state");
    table.boolean("carnaval", false);
    table.boolean("corpus_christi", false);

    table.primary(["code"]);
    table.index(["state"]);
  });

  console.log("areas table created");

  try {
    await readCSV("./estados.csv");
    await readCSV("./municipios-2019.csv");

    console.log("areas table populated");
  } catch (e) {
    console.log("skipping areas table population");
  }

  await knex.schema.createTableIfNotExists("holidays", function (table) {
    table.string("code");
    table.string("date");
    table.string("title");

    table.primary(["code", "date"]);
    table.foreign("code").references("areas.code");
  });

  console.log("holidays table created");

  try {
    await knex
      .insert({
        code: "0000000",
        date: "01-01",
        title: "Test",
      })
      .into("holidays");

    throw new Error("Foreign key constraint not working");
  } catch (e) {
    console.log("Foreign key constraint is working");
  }
}

function databaseExists() {
  return fs.existsSync("./holidays.sqlite");
}

async function dropDatabase() {
  return fs.promises.rm("./holidays.sqlite");
}

module.exports = { startDatabase, dropDatabase, databaseExists };
