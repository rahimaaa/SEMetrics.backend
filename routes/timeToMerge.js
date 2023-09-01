const axios = require("axios");
const router = require("express").Router();

const getPullRequestList = async (owner, access_token, repo_name) => {
  try {
    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${owner}/${repo_name}/pulls?state=all`;
    const githubApiHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };

    const response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching GitHub Pull Request data:", error);
    return [];
  }
};

const getColor = (avgTimeToMerge) => {
  if (avgTimeToMerge <= 1) {
    return "hsl(162, 100%, 41%)"; // Elite Metric Color
  } else if (avgTimeToMerge <= 2) {
    return "hsl(202, 100%, 50%)"; // Good Metric Color
  } else if (avgTimeToMerge <= 3) {
    return "hsl(280, 85%, 36%)"; // Medium Risk Color
  } else {
    return "hsl(352, 89%, 19%)"; // High Risk Color
  }
};

router.get("/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const pullRequests = await getPullRequestList(
      username,
      access_token,
      repo_name
    );

    // Filter pull requests that have both created_at and merged_at timestamps
    const mergedPullRequests = pullRequests.filter((pr) => pr.merged_at);

    // Calculate the average time to merge
    const timeToMergeArray = mergedPullRequests.map((pr) => {
      const createdAt = new Date(pr.created_at);
      const mergedAt = new Date(pr.merged_at);
      // Calculate time to merge in hours
      return (mergedAt - createdAt) / (1000 * 60 * 60); // Time in hours
    });

    const totalMergeTime = timeToMergeArray.reduce(
      (sum, timeToMerge) => sum + timeToMerge,
      0
    );
    const averageTimeToMerge = totalMergeTime / timeToMergeArray.length;

    // Format chart data
    const chartData = mergedPullRequests.map((pr) => ({
      x: pr.number, // Assuming PR number as x
      y: (new Date(pr.merged_at) - new Date(pr.created_at)) / (1000 * 60 * 60), // Time to merge in hours
    }));

    const chartDataFormatted = [
      {
        id: "Time to Merge",
        color: getColor(averageTimeToMerge),
        data: chartData,
      },
    ];

    res.json({ averageTimeToMerge, chartDataFormatted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
