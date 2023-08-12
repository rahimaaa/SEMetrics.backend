const express = require("express");
const github = require("../utils/github");
const passport = require("passport");
const authController = require("../controllers/auth");
const { User } = require("../database/models");
const router = express.Router();
const axios = require("axios");
const querystring = require("querystring");

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

// Function to get the access token from GitHub using the provided code
const getAccessToken = async (code) => {
  try {
    const response = await axios.post(
      `https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`,
      {},
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    const data = response.data;
    console.log("data:\n", data);
    if (data.access_token) {
      return data.access_token;
    } else {
      console.log("No access token received from GitHub");
    }
  } catch (error) {
    console.error("Error getting access token:", error);
  }
};
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("http://localhost:3000");
  }
);

router.get("/logout", authController.logout);

module.exports = router;
