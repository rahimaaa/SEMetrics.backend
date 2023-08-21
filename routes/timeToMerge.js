const axios = require("axios");
const router = require("express").Router();

const getRepoPullRequests = async (ownerName, repoName, access_token) => {
  try {
    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${ownerName}/${repoName}/pulls`;
    const githubApiHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };

    const response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });

    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

router.get("/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const pullRequests = await getRepoPullRequests(
      username,
      repo_name,
      access_token
    );

    // Filter pull requests that have both created_at and merged_at timestamps
    const mergedPullRequests = pullRequests.filter(
      (pr) => pr.merged_at && pr.created_at
    );

    // Map over the filtered pull requests to calculate time to merge for each
    const timeToMergeArray = mergedPullRequests.map((pr) => {
      const createdAt = new Date(pr.created_at);
      const mergedAt = new Date(pr.merged_at);
      // Calculate time to merge in hours
      const timeToMerge = (mergedAt - createdAt) / (1000 * 60 * 60); // Time in hours
      return timeToMerge;
    });

    // Calculate the average time to merge
    const averageTimeToMerge =
      timeToMergeArray.reduce((sum, timeToMerge) => sum + timeToMerge, 0) /
      timeToMergeArray.length;

    res.json({ averageTimeToMerge, timeToMergeArray });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});
module.exports = router;
