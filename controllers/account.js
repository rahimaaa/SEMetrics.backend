const axios = require("axios");

exports.user = async (req, res, next) => {
  const user = req.user;
  if (user && user.access_token) {
    try {
      const githubApiUrl = "https://api.github.com/user";
      const githubApiHeaders = {
        Accept: "application/json",
        Authorization: `Bearer ${user.access_token}`,
      };

      const response = await axios.get(githubApiUrl, {
        headers: githubApiHeaders,
      });

      res.json(response.data);
    } catch (error) {
      console.error("Error fetching GitHub user data:", error);
      res.status(500).json({ error: "Error fetching GitHub user data" });
    }
  } else {
    res.status(404).json({ error: "User not found" });
  }
};
