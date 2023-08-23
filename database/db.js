const { Sequelize } = require("sequelize");
const pg = require("pg");

const db = new Sequelize(
  process.env.DATABASE_URL,
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
