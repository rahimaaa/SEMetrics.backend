const express = require("express");
const passport = require("passport");
const accountController = require("../controllers/account");
const ensureAuthenticated = require("../middleware/ensureAuthenticated");
const router = express.Router();

router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

router.get("/", ensureAuthenticated, accountController.user);

router.use("/repos", ensureAuthenticated, require("./repos"));

module.exports = router;
