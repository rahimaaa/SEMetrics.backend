const router = require("express").Router();
const axios = require("axios");

async function getAllDeployments(username, repo_name, access_token) {
  const deployments = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const githubApiUrl = `https://api.github.com/repos/${username}/${repo_name}/deployments?page=${page}`;
      const githubApiHeaders = {
        accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      };

      const response = await axios.get(githubApiUrl, {
        headers: githubApiHeaders,
      });

      deployments.push(...response.data);
      hasNextPage =
        response.headers.link && response.headers.link.includes('rel="next"');
      page++;
    } catch (error) {
      console.log(error);
      hasNextPage = false;
    }
  }
  return deployments;
}

async function getFailedDeploymentStatus(
  username,
  repo_name,
  access_token,
  deployments
) {
  try {
    const failedDeployments = [];
    for (const deployment of deployments) {
      const githubApiUrl = `https://api.github.com/repos/${username}/${repo_name}/deployments/${deployment.id}/statuses`;
      const githubApiHeaders = {
        accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      };

      const response = await axios.get(githubApiUrl, {
        headers: githubApiHeaders,
      });

      const deploymentsStatus = response.data;

      const hasFailedStatus = deploymentsStatus.some(
        (status) => status.state === "failure"
      );

      if (hasFailedStatus) {
        failedDeployments.push(deploymentsStatus);
      }
    }
    return failedDeployments;
  } catch (error) {
    console.log(error);
  }
}

router.get("/:repo_name", async (req, res) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    if (!username || !repo_name || !access_token) {
      return res.status(400).send("Cannot Fetch Run Attempts");
    }

    const allDeployments = await getAllDeployments(
      username,
      repo_name,
      access_token
    );

    const totalDeployments = allDeployments.length;
    if (totalDeployments === 0) {
      return res.send("No deployments have been done");
    }

    const failedDeployments = await getFailedDeploymentStatus(
      username,
      repo_name,
      access_token,
      allDeployments
    );

    const cfr = (failedDeployments.length / totalDeployments).toFixed(2);
    console.log("CFR:", cfr);

    res.json({ totalDeployments, failedDeployments, cfr }); // Send CFR as JSON response
  } catch (error) {
    console.log("Error fetching data from Github API:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
