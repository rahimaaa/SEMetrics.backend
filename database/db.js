const { Sequelize } = require("sequelize");
const pg = require("pg");

const db = new Sequelize(
  "postgres://default:p7AQYBjzw6SJ@ep-blue-truth-89017417.us-east-1.postgres.vercel-storage.com:5432/verceldb",
  {
    logging: false,
    dialectModule: pg,
    dialectOptions: {
      ssl: true,
    },
  }
);

//Test Conection
db.authenticate()
  .then(() => {
    console.log("DB connection works");
  })
  .catch((error) => {
    console.error("DB connection failed:", error);
  });

module.exports = db;
