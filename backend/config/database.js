// ============================================================
//  config/database.js — Sequelize Connection Setup
// ============================================================
//  Reads DATABASE_URL from .env and creates a Sequelize instance.
//  Supports PostgreSQL (default) and SQLite (e.g. for testing).
// ============================================================

require("dotenv").config();
const { Sequelize } = require("sequelize");

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://postgres:password@localhost:5432/trustchain";

let sequelize;

if (databaseUrl.startsWith("sqlite:")) {
  const storagePath = databaseUrl.replace("sqlite:", "") || ":memory:";
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: storagePath,
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
  });
} else {
  const sequelizeOptions = {
    dialect: "postgres",
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  };

  if (process.env.DB_SSL === "true" || databaseUrl.includes("sslmode=require")) {
    sequelizeOptions.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };
  }

  sequelize = new Sequelize(databaseUrl, sequelizeOptions);
}

module.exports = sequelize;
