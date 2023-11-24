const { app, knex } = require("./index");
const { startDatabase, dropDatabase, databaseExists } = require("./migrate");

const supertest = require("supertest");

describe("API de Feriados", () => {
  let server;
  let agent;

  beforeAll(async () => {
    const dbExists = databaseExists();

    if (dbExists) {
      await dropDatabase();
    }

    await startDatabase();

    server = app.listen(3333);
    agent = supertest.agent(server);
  });

  afterAll(async () => {
    await dropDatabase();

    server.close();
    knex.destroy();
  });

  test("GET /feriados/:code/:date - dia dos trabalhadores - 001", async () => {
    const response = await agent.get("/feriados/1600501/2020-05-01/");

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Dia do Trabalhador");
  });

  test("GET /feriados/:code/:date - dia dos trabalhadores - 002", async () => {
    const response = await agent.get("/feriados/4305439/2020-05-01/");

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Dia do Trabalhador");
  });

  test("DELETE /feriados/:code/:date - removendo feriado nacional de um município", async () => {
    const response = await agent.delete("/feriados/4305439/05-01/");

    expect(response.status).toBe(403);
  });

  test("PUT /feriados/:code/:date - consciencia negra RJ", async () => {
    const response = await agent
      .put("/feriados/33/11-20/")
      .set("Accept", "application/json")
      .set("Content-Type", "application/json")
      .send({ name: "Consciência Negra" });

    expect([200, 201]).toContain(response.status);
  });

  test("GET /feriados/:code/:date - consciencia negra RJ - 001", async () => {
    const response = await agent.get("/feriados/33/2020-11-20/");

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Consciência Negra");
  });

  test("GET /feriados/:code/:date - consciencia negra RJ - 002", async () => {
    const response = await agent.get("/feriados/3304557/2020-11-20/");

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Consciência Negra");
  });

  test("DELETE /feriados/:code/:date - removendo feriado estadual de um município", async () => {
    const response = await agent.delete("/feriados/3304557/11-20/");

    expect(response.status).toBe(403);
  });

  test("DELETE /feriados/:code/:date - removendo feriado estadual de um estado", async () => {
    const response = await agent.delete("/feriados/33/11-20/");

    expect(response.status).toBe(204);
  });

  test("GET /feriados/:code/:date - sexta-feira santa", async () => {
    const response = await agent.get("/feriados/2111300/2020-04-10/");

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Sexta-Feira Santa");
  });

  test("PUT /feriados/:code/:date - corpus christi ouro preto", async () => {
    const response = await agent.put("/feriados/3146107/corpus-christi");

    expect([200, 201]).toContain(response.status);
  });

  test("GET /feriados/:code/:date - corpus christi ouro preto - 001", async () => {
    const response = await agent.get("/feriados/3146107/2020-06-11/");

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Corpus Christi");
  });

  test("GET /feriados/:code/:date - corpus christi ouro preto - 002", async () => {
    const response = await agent.get("/feriados/3146107/2021-06-03/");

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Corpus Christi");
  });
});
