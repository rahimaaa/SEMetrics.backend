const axios = require("axios");
const router = require("express").Router();
const ensureAuthenticated = require("../middleware/ensureAuthenticated");

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

router.get("/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const commits = await getRepoCommits(username, repo_name, access_token);

    const thresholdDays = 3; // 3 days for us will be considered a refactor
    const thresholdTimestamp = Date.now() - thresholdDays * 24 * 60 * 60 * 1000;

    let reworkCommitCount = 0;
    let totalCommits = 0;

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const commitTimestamp = new Date(commit.commit.author.date).getTime();

      if (commitTimestamp < thresholdTimestamp) {
        totalCommits++;

        const filesChangedInCommit = commit.files.map((file) => file.filename);

        for (let j = i + 1; j < commits.length; j++) {
          const laterCommit = commits[j];
          const laterCommitTimestamp = new Date(
            laterCommit.commit.author.date
          ).getTime();

          if (
            laterCommitTimestamp - commitTimestamp >
            thresholdDays * 24 * 60 * 60 * 1000
          ) {
            break;
          }

          const filesChangedInLaterCommit = laterCommit.files.map(
            (file) => file.filename
          );

          const commonFiles = filesChangedInCommit.filter((file) =>
            filesChangedInLaterCommit.includes(file)
          );

          if (commonFiles.length > 0) {
            reworkCommitCount++;
            break;
          }
        }
      }
    }

    const reworkPercentage = ((reworkCommitCount / totalCommits) * 100).toFixed(
      2
    );

    res.json({ reworkPercentage: `${reworkPercentage}%` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
