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
  (req, res) => {
    console.log("login with github");
  }
);
// router.use((req, res, next) => {
//   console.log('Current URL path:', req.originalUrl);
//   next();
// });

// Function to get the access token from GitHub using the provided code
const getAccessToken = async (code) => {
  try {
    const params = {
      // client_id: process.env.GITHUB_CLIENT_ID,
      client_id: "4e2980e1097efa4ccf8e",
      // client_secret: process.env.GITHUB_CLIENT_SECRET,
      client_secret: "4ae3cb369dcf5966fc59286ef47308cbcdaaf3ad",
      code: code,
    };
    const opts = { headers: { accept: "application/json" }, params: params };
    const response = await axios.get(
      `https://github.com/login/oauth/access_token`,
      null,
      {
        headers: {
          Accept: "application/json",
        },
        params: {
          // client_id: process.env.GITHUB_CLIENT_ID,
          client_id: "4e2980e1097efa4ccf8e",
          // client_secret: process.env.GITHUB_CLIENT_SECRET,
          client_secret: "4ae3cb369dcf5966fc59286ef47308cbcdaaf3ad",
          code: code,
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
  async (req, res) => {
    try {
      console.log("Current URL path:", req.originalUrl);
      const code = req.query.code;
      console.log("code from params: ", code);

      const accessToken = await getAccessToken(code);

      console.log("accessToken in callback: ", accessToken);

      const githubId = req.user?.githubId; // Assuming the authenticated user's githubId is available
      if (!githubId) {
        throw new Error("GitHub user id not available");
      }

      // Update the user's access_token in the database
      const updatedUser = await User.findOneAndUpdate(
        { githubId },
        { access_token: accessToken },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error("User not found");
      }

      console.log(
        "Successfully updated access token:",
        updatedUser.access_token
      );

      // Redirect the user back to the frontend
      res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
    } catch (error) {
      console.error("Error during GitHub callback:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
// router.get(
//   "/github/callback",
//   passport.authenticate("github", { failureRedirect: "/" }),
//   async (req, res) => {
//     try {
//       console.log("code: ", req.query.code);

//       const data = getAccessToken(req.query.code);
//       // const code = req.query.code;
//       // console.log("Received code:", code);

//       // const params = {
//       //   client_id: process.env.GITHUB_CLIENT_ID,
//       //   client_secret: process.env.GITHUB_CLIENT_SECRET,
//       //   code: code,
//       // };
//       // const githubUrl = "https://github.com/login/oauth/access_token";
//       // // Request access token from GitHub
//       // const response = await axios.post(githubUrl, null, {
//       //   params,
//       //   headers: {
//       //     Accept: "application/json",
//       //   },
//       // });
//       // console.log(response);
//       // const params = `?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`;
//       // const github_url = "https://github.com/login/oauth/access_token" + params;
//       // // Request access token from GitHub
//       // const response = await axios.post(
//       //   github_url,
//       //   {},
//       //   {
//       //     headers: {
//       //       Accept: "application/json",
//       //     },
//       //   }
//       // );
//       // console.log(response);
//       // const parsedData = querystring.parse(response.data);
//       // console.log("Parsed data:", parsedData);

//       // if (parsedData.error) {
//       //   console.error("GitHub error:", parsedData.error);
//       //   res.status(400).json({ error: parsedData.error });
//       //   return;
//       // }

//       const { access_token } = response.data;

//       // if (!access_token) {
//       //   throw new Error("No access token received from GitHub");
//       // }

//       const githubId = req.user?.githubId; // Assuming the authenticated user's githubId is available

//       if (!githubId) {
//         throw new Error("GitHub user id not available");
//       }

//       // Update the user's access_token in the database
//       const user = req.user;
//       // const user = await User.findOneAndUpdate(
//       //   { githubId },
//       //   { access_token },
//       //   { new: true }
//       // );

//       if (!user) {
//         throw new Error("User not found");
//       }

//       console.log("Successfully updated access token:", access_token);

//       // Redirect the user back to the frontend
//       res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
//     } catch (error) {
//       console.error("Error during GitHub callback:", error);
//       res.status(500).json({ error: "Internal server error" });
//     }
//   }
// );

router.get("/logout", authController.logout);

module.exports = router;
