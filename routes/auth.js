const express = require("express");
const github = require("../utils/github");
const passport = require("passport");
const authController = require("../controllers/auth");

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
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/" })
  //   (req, res) => res.redirect("/account")
);

router.get("/logout", authController.logout);

module.exports = router;
