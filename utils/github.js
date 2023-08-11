const GitHubStrategy = require("passport-github2").Strategy;
const { User } = require("../database/models");

module.exports = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ["user:email", "read:user", "repo"],
  },
  function (accessToken, refreshToken, profile, done) {
    console.log("in github strategy");
    console.log("acccesToken: ", accessToken);
    User.findOne({ githubId: profile.id }).then((user, err) => {
      if (!user)
        return User.create({
          githubId: profile.id,
          fullname: profile.displayName,
          username: profile.username,
          email: profile.emails[0].value,
          profilePhoto: profile._json.avatar_url,
          access_token: accessToken,
        }).then((user, err) => {
          return done(null, user);
        });
      else return done(null, user);
    });
  }
);
