require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const {db}= require("./database/db")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.enable("trust proxy");


app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
      allowedHeaders:
        "Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
      preflightContinue: true,
    })
  );

app.get("/", () => {
    res.send("Hey It's Working");
})

app.use("/api", require("./api"));

//Start Server
const serverRun = () => {
  app.listen(process.env.PORT, () => {
    console.log(`Live on port: ${process.env.PORT}`);
  });
};

async function main() {
  await connectDB();
  await serverRun();
}

main();