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
    // Successful authentication, set the cookie here
    res.cookie('connect.sid', req.cookies, {
      maxAge: 900000, // Cookie expiry time
      httpOnly: true, // Flag to make cookie not accessible via JavaScript
      secure: true, // Flag to make cookie only work over HTTPS
      sameSite: 'none', // SameSite attribute for cookie
      domain: 'your-domain.com' // Domain where the cookie is valid
    });

    // Redirect to the dashboard
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
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
