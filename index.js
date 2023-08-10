require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const { db } = require("./database/db");
const github = require("./utils/github");
const passport = require("passport");
const authRouter = require("./routes/auth");
const accountRouter = require("./routes/account");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.enable("trust proxy");

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// passport.use(github);

// passport.initialize();
// passport.session();

// passport.serializeUser(function (user, done) {
//   done(null, user);
// });

// passport.deserializeUser(function (obj, done) {
//   done(null, obj);
// });

app.get("/", (req, res) => {
  res.send("Hey It's Working");
});

app.use("/auth", authRouter);
app.use("/account", accountRouter);

//Start Server
const serverRun = () => {
  app.listen(process.env.PORT, () => {
    console.log(`Live on port: ${process.env.PORT}`);
  });
};

async function main() {
  await serverRun();
}

main();
