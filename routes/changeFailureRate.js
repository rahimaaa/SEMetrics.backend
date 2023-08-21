const router = require("express").Router();
const axios = require("axios");

router.get("/:repo_name", async (req, res) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    if (!username || !repo_name || !access_token) {
      return res.status(400).send("Cannot Fetch Change Failure Rate");
    }
    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${username}/${repo_name}/actions/runs`;
    const githubApiHeaders = {
      accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };
    const response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });
    const workflowRuns = response.data.workflow_runs;
    const totalRuns = workflowRuns.length;
    const failedRuns = workflowRuns.filter(
      (run) => run.conclusion === "failure"
    ).length;
    // Check if totalRuns is zero to avoid division by zero
    if (totalRuns === 0) {
      // Handle the case where there are no runs
      res.json({ changeFailureRate: 0 });
      return;
    }

    // Calculate change failure rate
    const changeFailureRate = (failedRuns / totalRuns) * 100;
    console.log("Change failure rate:", changeFailureRate);
    res.json({ changeFailureRate });
  } catch (error) {
    console.log("Error fetching data from Github API:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
