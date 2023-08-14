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
    console.log(response.data);

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

//This fucntion is to get more information of each commit, for us to work,
//because getting the list of commits left behind importna info
// like amount of file change, additions and deletiosn as well,

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
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

router.get("/", async (req, res, next) => {
  try {
    const access_token = req.user.access_token;

    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/user/repos`;
    const githubApiHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };

    const response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching GitHub user data:", error);
    res.status(500).json({ error: "Error fetching GitHub user data" });
  }
});

const calculateImpact = (commits) => {
  const impactData = [];

  commits.forEach((commit) => {
    const { stats, files } = commit;

    const additions = stats.additions;
    const deletions = stats.deletions;
    const totalChanges = additions + deletions;

    const affectedFiles = files.map((file) => file.filename);

    const impact = totalChanges * affectedFiles.length * 0.1;

    impactData.push({
      date: commit.commit.author.date,
      impact: impact,
      files: affectedFiles,
    });
  });

  impactData.sort((a, b) => new Date(b.date) - new Date(a.date));

  return impactData;
};

router.get("/impact/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const commits = await getRepoCommits(username, repo_name, access_token);

    const impactData = calculateImpact(commits);

    const chartData = [
      {
        id: "Impact",
        color: "hsl(25, 70%, 50%)", // Line color (you can set it as needed)
        data: impactData.map((item) => ({
          x: new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(item.date)),
          y: item.impact,
        })),
      },
    ];

    res.json(chartData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
