const GitHubStrategy = require("passport-github2").Strategy;
const { User } = require("../database/models");

module.exports = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
  },
  function (accessToken, refreshToken, profile, done) {
    User.findOne({ githubId: profile.id }).then((user, err) => {
      if (!user)
        return User.create({
          githubId: profile.id,
          fullname: profile.displayName,
          username: profile.username,
          email: profile._json.email,
          profilePhoto: profile._json.avatar_url,
        }).then((user, err) => {
          return done(null, user);
        });
      else return done(null, user);
    });
  }
);
