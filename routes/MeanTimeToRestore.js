const axios = require("axios");
const router = require("express").Router();
const ensureAuthenticated = require("../middleware/ensureAuthenticated");

router.get("/:repo_name", ensureAuthenticated, async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${username}/${repo_name}/deployments`;
    const githubApiHeaders = {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${access_token}`,
    };

    const response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });

    const deployments = response.data;

    const deploymentStatusPromises = deployments.map(async (deployment) => {
      const deploymentStatusUrl = deployment.statuses_url;
      const statusResponse = await axios.get(deploymentStatusUrl, {
        headers: githubApiHeaders,
      });
      return statusResponse.data;
    });

    const deploymentStatuses = await Promise.all(deploymentStatusPromises);

    let restoreTimes = [];
    let lastFailureTime = null;

    for (const statusList of deploymentStatuses) {
      for (const status of statusList) {
        if (status.state === "failure") {
          lastFailureTime = new Date(status.created_at);
        } else if (status.state === "success" && lastFailureTime) {
          const restoreTime = new Date(status.created_at) - lastFailureTime;
          restoreTimes.push(restoreTime);
          lastFailureTime = null;
        }
      }
    }

    if (restoreTimes.length === 0) {
      return res.json("0 hr 0 mins");
    }

    const totalRestoreTime = restoreTimes.reduce((sum, time) => sum + time, 0);
    const meanRestoreTime = totalRestoreTime / restoreTimes.length;

    const meanRestoreTimeMillis = meanRestoreTime / restoreTimes.length;

    const hours = Math.floor(meanRestoreTimeMillis / (1000 * 60 * 60));
    const minutes = Math.floor(
      (meanRestoreTimeMillis % (1000 * 60 * 60)) / (1000 * 60)
    );

    const formattedMTTR = `${hours} hrs ${minutes} mins`;

    res.json(formattedMTTR);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
