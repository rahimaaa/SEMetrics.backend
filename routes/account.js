const express = require("express");
const passport = require("passport");
const accountController = require("../controllers/account");

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

// Middleware to ensure that the user is authenticateds
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    console.log("Unauthorized");
  }
}

module.exports = router;
