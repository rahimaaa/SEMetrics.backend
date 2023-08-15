require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const db = require("./database/db");
const authRouter = require("./routes/auth");
const accountRouter = require("./routes/account");
const deploymentRouter = require("./routes/deployment"); 
const SequelizeStore = require("connect-session-sequelize")(session.Store);

const sessionStore = new SequelizeStore({ db });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.enable("trust proxy");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      // process.env.FRONTEND_URL || "http://localhost:3000",
      process.env.GITHUB_CALLBACK_URL,
    ],
    credentials: true,
    allowedHeaders:
      "Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
    preflightContinue: true,
  })
);

app.use(
  session({
    secret: "secret",
    store: sessionStore,
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // The maximum age (in milliseconds) of a valid session.
      secure: false,
      httpOnly: false,
      sameSite: false,
    },
  })
);

app.get("/", (req, res) => {
  console.log("got to the endpoint");
  res.send("Hey It's Working");
});

app.use("/auth", authRouter);
app.use("/account", accountRouter);
app.use("/deployment", deploymentRouter);

//Start Server
const serverRun = () => {
  app.listen(process.env.PORT, () => {
    console.log(`Live on port: ${process.env.PORT}`);
  });
};

async function main() {
  console.log("This is going to print models: ", db.models);
  await sessionStore.sync();
  await db.sync();
  await serverRun();
}

main();
