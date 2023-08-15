const axios = require("axios");
const router = require("express").Router();

const getRepoCommits = async (ownerName, repoName, access_token) => {
  try {
    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${ownerName}/${repoName}/commits`;
    const githubApiHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };

    const response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });

    const commits = response.data;

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const detailedCommit = await getASingleCommit(
        ownerName,
        repoName,
        commit,
        access_token
      );
      if (detailedCommit) {
        commits[i] = detailedCommit;
      }
    }

    return commits;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getASingleCommit = async (ownerName, repoName, commit, access_token) => {
  try {
    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${ownerName}/${repoName}/commits/${commit.sha}`;
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

router.get("/rework-rate/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const commits = await getRepoCommits(username, repo_name, access_token);

    const reworkCommits = commits.filter((commit) => {
      return commit.stats.additions + commit.stats.deletions > changesThreshold;
    });

    const totalCommits = commits.length;
    const reworkCommitCount = reworkCommits.length;
    const reworkRate = (reworkCommitCount / totalCommits) * 100;

    res.json(reworkRate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
