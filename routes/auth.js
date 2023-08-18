const express = require("express");
const github = require("../utils/github");
const passport = require("passport");
const router = express.Router();

passport.use(github);

router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
  (req, res) => {}
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("http://localhost:3000/colab-metrics");
  }
);

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    console.log("Logout successful in req.logout");

    req.session.destroy(function (err) {
      if (err) {
        console.log(err);
        res.status(500).send("Error occurred during logout");
      } else {
        res.clearCookie("connect.sid");
        res.send("Logout successful");
      }
    });
  });
});

module.exports = router;
