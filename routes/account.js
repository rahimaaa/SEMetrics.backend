const express = require("express");
const passport = require("passport");
const accountController = require("../controllers/account");
const ensureAuthenticated = require("../middleware/ensureAuthenticated");
const axios = require("axios");
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

router.get("/repos", ensureAuthenticated, async (req, res, next) => {
  try {
    const access_token = req.user.access_token;

    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/user/repos`;
    const githubApiHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };

    const response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching GitHub user data:", error);
    res.status(500).json({ error: "Error fetching GitHub user data" });
  }
});

module.exports = router;
