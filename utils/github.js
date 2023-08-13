const GitHubStrategy = require("passport-github2").Strategy;
const { User } = require("../database/models");

module.exports = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ["user:email", "read:user", "repo"],
  },
  async function (accessToken, refreshToken, profile, done) {
    console.log("in GitHub strategy");
    console.log("accessToken: ", accessToken);

    try {
      const user = await User.findOne({ where: { githubId: profile.id } });

      if (!user) {
        const newUser = await User.create({
          githubId: profile.id,
          fullname: profile.displayName,
          username: profile.username,
          email: profile.emails[0].value,
          profilePhoto: profile._json.avatar_url,
          access_token: accessToken,
        });
        return done(null, newUser);
      } else {
        return done(null, user);
      }
    } catch (error) {
      console.error("Error in GitHubStrategy: ", error);
      return done(error);
    }
  }
);
