const express = require("express");

const { knex } = require("./knex.config");

const easterCalculator = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);

  const month = Math.floor((h + L - 7 * m + 114) / 31);
  const day = 1 + ((h + L - 7 * m + 114) % 31);

  const formattedMonth = month < 10 ? `0${month}` : month;
  const formattedDay = day < 10 ? `0${day}` : day;

  return `${year}-${formattedMonth}-${formattedDay}`;
};

const easterCache = new Map();

const getEasterDay = (year) => {
  if (easterCache.has(year)) {
    return easterCache.get(year);
  }

  const easterDay = easterCalculator(year);

  easterCache.set(year, easterDay);

  return easterDay;
};

const holidaysCache = new Map();

const getFloatingBrazilHolidays = (year) => {
  if (holidaysCache.has(year)) {
    return holidaysCache.get(year);
  }

  const easterDay = new Date(getEasterDay(year));

  const carnavalDay = new Date(easterDay);

  carnavalDay.setDate(carnavalDay.getDate() - 47);

  const corpusChristiDay = new Date(easterDay);

  corpusChristiDay.setDate(corpusChristiDay.getDate() + 60);

  const goodFridayDay = new Date(easterDay);

  goodFridayDay.setDate(goodFridayDay.getDate() - 2);

  const floatingBrazilHolidays = new Map();

  floatingBrazilHolidays.set("pascoa", {
    name: "Páscoa",
    date: easterDay.toISOString().split("T")[0],
  });
  floatingBrazilHolidays.set("carnaval", {
    name: "Carnaval",
    date: carnavalDay.toISOString().split("T")[0],
  });
  floatingBrazilHolidays.set("corpus-christi", {
    name: "Corpus Christi",
    date: corpusChristiDay.toISOString().split("T")[0],
  });
  floatingBrazilHolidays.set("sexta-feira-santa", {
    name: "Sexta-Feira Santa",
    date: goodFridayDay.toISOString().split("T")[0],
  });

  holidaysCache.set(year, floatingBrazilHolidays);

  return floatingBrazilHolidays;
};

const fixedBrazilHolidays = new Map();

fixedBrazilHolidays.set("01/01", "Ano Novo");
fixedBrazilHolidays.set("21/04", "Tiradentes");
fixedBrazilHolidays.set("01/05", "Dia do Trabalhador");
fixedBrazilHolidays.set("07/09", "Independência");
fixedBrazilHolidays.set("12/10", "Nossa Senhora Aparecida");
fixedBrazilHolidays.set("02/11", "Finados");
fixedBrazilHolidays.set("15/11", "Proclamação da República");
fixedBrazilHolidays.set("25/12", "Natal");

const router = express.Router();

router.use(express.json());

const holidayResourceUrl = "/feriados/:code/:date";

const isValidDate = (date) => {
  try {
    const dateObject = new Date(date);

    return dateObject instanceof Date && !isNaN(dateObject.getTime());
  } catch (e) {
    return false;
  }
};

const searchHolidayParamsValidationMiddleware = (req, res, next) => {
  const { code, date } = req.params;

  if (!code || !date) {
    return res.status(400).send();
  }

  const codeRegex = /^(\d{2}|\d{7})$/;
  const yyyymmddRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (
    !codeRegex.test(code) ||
    !yyyymmddRegex.test(date) ||
    !isValidDate(date)
  ) {
    return res.status(400).send();
  }

  next();
};

const createHolidayParamsValidationMiddleware = (req, res, next) => {
  const { code, date } = req.params;

  if (!code || !date) {
    return res.status(400).send();
  }

  const codeRegex = /^(\d{2}|\d{7})$/;
  const dateRegex =
    /^((0[1-9]|1[0-2])-([0-2][1-9]|[1-3][0-1])|corpus-christi|carnaval)$/;

  const customHolidaysRegex = /^(corpus-christi|carnaval)$/;

  if (!codeRegex.test(code) || !dateRegex.test(date)) {
    return res.status(400).send();
  }

  if (customHolidaysRegex.test(date)) {
    return next();
  }

  const invalidDays = new Map();

  invalidDays.set("02", ["30", "31"]);
  invalidDays.set("04", ["31"]);
  invalidDays.set("06", ["31"]);
  invalidDays.set("09", ["31"]);
  invalidDays.set("11", ["31"]);

  const [month, day] = date.split("-");

  if (invalidDays.has(month) && invalidDays.get(month).includes(day)) {
    return res.status(400).send();
  }

  next();
};

const searchCache = new Map();

function addCache(key, value, code, state) {
  searchCache.set(key, value);

  if (code) {
    const oldAreaKeys = areaRelatedCacheKeys.get(code) ?? [];

    areaRelatedCacheKeys.set(code, [...oldAreaKeys, key]);
  }

  if (state) {
    const oldStateKeys = stateRelatedCacheKeys.get(state) ?? [];

    stateRelatedCacheKeys.set(state, [...oldStateKeys, key]);
  }

  const SECOND = 1000;

  setTimeout(() => {
    searchCache.delete(key);

    if (code) {
      const oldAreaKeys = areaRelatedCacheKeys.get(code) ?? [];

      areaRelatedCacheKeys.set(
        code,
        oldAreaKeys.filter((key) => key !== key)
      );
    }

    if (state) {
      const oldStateKeys = stateRelatedCacheKeys.get(state) ?? [];

      stateRelatedCacheKeys.set(
        state,
        oldStateKeys.filter((key) => key !== key)
      );
    }
  }, 30 * SECOND);
}

const stateRelatedCacheKeys = new Map();
const areaRelatedCacheKeys = new Map();

router.get(
  holidayResourceUrl,
  searchHolidayParamsValidationMiddleware,
  async (req, res) => {
    const { code, date } = req.params;

    const key = `${code}.${date}`;

    if (searchCache.has(key)) return res.status(200).json(searchCache.get(key));

    const ddMMDate = date.split("-").reverse().join("/").slice(0, 5);

    const fixedHoliday = fixedBrazilHolidays.get(ddMMDate);

    if (fixedHoliday) {
      addCache(key, { name: fixedHoliday });

      return res.status(200).json({ name: fixedHoliday });
    }

    const floatingHolidays = getFloatingBrazilHolidays(
      parseInt(date.split("-")[0])
    );

    const nationalHolidays = [
      floatingHolidays.get("pascoa").date,
      floatingHolidays.get("sexta-feira-santa").date,
    ];

    if (nationalHolidays.includes(date)) {
      const holiday = nationalHolidays.findIndex((holiday) => holiday === date);

      const floatingKey = holiday === 0 ? "pascoa" : "sexta-feira-santa";

      const name = floatingHolidays.get(floatingKey).name;

      const data = { name };

      addCache(key, data);

      return res.status(200).json(data);
    }

    const areaHolidays = [
      floatingHolidays.get("carnaval").date,
      floatingHolidays.get("corpus-christi").date,
    ];

    const areaHoliday = areaHolidays.findIndex((holiday) => holiday === date);

    const state = code.substring(0, 2);

    if (areaHoliday !== -1) {
      const area = await knex
        .select("*")
        .from("areas")
        .where({ code })
        .limit(1);

      if (!area[0]) return res.status(404).send();

      const cityArea = area.find((area) => area.code === code);

      const hasCarnaval = Boolean(cityArea.carnaval);
      const hasCorpusChristi = Boolean(cityArea.corpus_christi);

      const isCarnaval = areaHoliday === 0 && hasCarnaval;
      const isCorpusChristi = areaHoliday === 1 && hasCorpusChristi;

      const hasHoliday = isCarnaval || isCorpusChristi;

      if (hasHoliday) {
        const data = {};

        data.name = isCarnaval
          ? "Carnaval"
          : isCorpusChristi
          ? "Corpus Christi"
          : undefined;

        addCache(key, data, code, state);

        return res.status(200).json(data);
      }
    }

    const queryDate = date.split("-").slice(1).join("-");

    const holiday = await knex
      .select("*")
      .from("holidays")
      .where({ code, date: queryDate })
      .orWhere({ code: state, date: queryDate })
      .limit(2);

    if (!holiday || (Array.isArray(holiday) && holiday.length === 0))
      return res.status(404).send();

    const stateHoliday = holiday.find((holiday) => holiday.code === state);
    const cityHoliday = holiday.find((holiday) => holiday.code === code);

    if (cityHoliday) {
      const data = { name: cityHoliday.title };

      addCache(key, data, code);

      return res.status(200).json(data);
    }

    const data = { name: stateHoliday.title };

    addCache(key, data, code, state);

    return res.status(200).json(data);
  }
);

router.put(
  holidayResourceUrl,
  createHolidayParamsValidationMiddleware,
  async (req, res) => {
    const { code, date } = req.params;
    const { name } = req.body;

    const customHolidaysRegex = /^(corpus-christi|carnaval)$/;

    if (customHolidaysRegex.test(date)) {
      const key = date.replace("-", "_");

      const isState = code.length === 2;

      await knex
        .update({
          [key]: true,
        })
        .from("areas")
        .where({
          [isState ? "state" : "code"]: code,
        });

      return res.status(200).send();
    }

    try {
      await knex
        .insert({
          code: code,
          date: date,
          title: name,
        })
        .into("holidays");

      return res.status(201).send();
    } catch (_e) {
      return res.status(422).send();
    }
  }
);

router.delete(
  holidayResourceUrl,
  createHolidayParamsValidationMiddleware,
  async (req, res) => {
    const { code, date } = req.params;

    const ddMMDate = date.split("-").reverse().join("/").substring(0, 5);

    if (fixedBrazilHolidays.has(ddMMDate)) {
      return res.status(403).send();
    }

    const customHolidaysRegex = /^(corpus-christi|carnaval)$/;

    const isState = code.length === 2;

    if (customHolidaysRegex.test(date)) {
      const area = await knex
        .select("*")
        .from("areas")
        .where({ code })
        .limit(1);

      if (!area) return res.status(404).send();

      const key = date.replace("-", "_");

      await knex
        .update({ [key]: false })
        .from("areas")
        .where({ [isState ? "state" : "code"]: code });
    } else {
      const state = code.substring(0, 2);

      const dbHolidays = await knex
        .select("*")
        .from("holidays")
        .where({ code: state, date })
        .orWhere({ code: code, date })
        .limit(2);

      const stateHoliday = dbHolidays.find((holiday) => holiday.code === state);
      const areaHoliday = dbHolidays.find((holiday) => holiday.code === code);

      if (stateHoliday && code !== state) {
        return res.status(403).send();
      }

      if (!areaHoliday) {
        return res.status(404).send();
      }

      await knex.delete().from("holidays").where({ code, date });
    }

    if (isState) {
      const stateKeys = stateRelatedCacheKeys.get(code) ?? [];

      stateKeys.forEach((key) => {
        if (searchCache.has(key)) searchCache.delete(key);
      });

      if (stateRelatedCacheKeys.has(code)) stateRelatedCacheKeys.delete(code);
    }

    const areaKeys = areaRelatedCacheKeys.get(code) ?? [];

    areaKeys.forEach((key) => {
      if (searchCache.has(key)) searchCache.delete(key);
    });

    if (areaRelatedCacheKeys.has(code)) areaRelatedCacheKeys.delete(code);

    return res.status(204).send();
  }
);

const app = express();

app.use(router);

module.exports = {
  app,
  knex,
};
