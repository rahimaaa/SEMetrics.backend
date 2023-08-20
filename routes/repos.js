const axios = require("axios");
const router = require("express").Router();
router.use('./pullRequest', require('./pullRequest'));

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
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

router.get("/", async (req, res, next) => {
  try {
    const { username, access_token } = req.user;
    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/users/${username}/repos`;
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

router.get("/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${username}/${repo_name}`;
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

router.get("/collabs/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${username}/${repo_name}/collaborators`;
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

router.get("/new_work/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const commits = await getRepoCommits(username, repo_name, access_token);

    const newWorkCommits = commits.filter(isCommitAddingNewCode);

    const chartData = [
      {
        id: "New Work",
        color: "hsl(25, 70%, 50%)", // Line color (you can set it as needed)
        data: newWorkCommits.map((commit) => ({
          x: new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(commit.commit.author.date)),
          y: commit.stats.additions,
        })),
      },
    ];

    res.json(chartData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

const getRepoDeployments = async (username, repoName, access_token) => {
  try {
    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${username}/${repoName}/deployments`;
    const githubApiHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };

    let response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });

    const deployments = response.data.map((deployment) => ({
      sha: deployment.sha,
      date: deployment.created_at, // or deployment.updated_at depending on your use case
    }));

    return deployments;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const calculateLeadTime = (commits, deployments) => {
  const leadTimeData = [];

  deployments.forEach((deployment) => {
    const deploymentDate = new Date(deployment.date);
    const commit = commits.find((commit) => commit.sha === deployment.sha);

    if (commit) {
      const commitDate = new Date(commit.commit.author.date);
      const leadTime = (deploymentDate - commitDate) / (1000 * 60 * 60); // in hours

      leadTimeData.push({
        date: deploymentDate,
        leadTime: leadTime,
      });

      console.log("This is leadtime", leadTime);
    }
  });

  leadTimeData.sort((a, b) => b.date - a.date);

  return leadTimeData;
};

router.get("/lead_time/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const commits = await getRepoCommits(username, repo_name, access_token);
    const deployments = await getRepoDeployments(
      username,
      repo_name,
      access_token
    );

    const leadTimeData = calculateLeadTime(commits, deployments);

    const chartData = [
      {
        id: "Lead Time",
        color: "hsl(25, 70%, 50%)", // Line color (you can set it as needed)
        data: leadTimeData.map((item) => ({
          x: new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(item.date)),
          y: item.leadTime, // Using leadTime here instead of impact
        })),
      },
    ];

    res.json(chartData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

const isCommitAddingNewCode = (commit) => {
  const threshold = 10;

  const additions = commit.stats.additions;
  const deletions = commit.stats.deletions;

  return additions > threshold && deletions < threshold;
};

const calculateCommitComplexity = (commits) => {
  const complexityData = commits.map((commit) => {
    const totalChanges = commit.stats.additions + commit.stats.deletions;
    const filesChanged = commit.files.length;
    const commitComplexity = totalChanges * filesChanged;

    return {
      date: commit.commit.author.date,
      complexity: commitComplexity,
    };
  });

  complexityData.sort((a, b) => new Date(b.date) - new Date(a.date));

  return complexityData;
};

router.get("/complexity/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const commits = await getRepoCommits(username, repo_name, access_token);

    const complexityData = calculateCommitComplexity(commits);

    const chartData = [
      {
        id: "Commit Complexity",
        color: "hsl(25, 70%, 50%)",
        data: complexityData.map((item) => ({
          x: new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(item.date)),
          y: item.complexity,
        })),
      },
    ];

    res.json(chartData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/legacy-refactor/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const commits = await getRepoCommits(username, repo_name, access_token);

    const thresholdDays = 3; // 3 days for us will be consider refactor
    const thresholdTimestamp = Date.now() - thresholdDays * 24 * 60 * 60 * 1000;

    const legacyRefactorCommits = [];

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const commitTimestamp = new Date(commit.commit.author.date).getTime();

      if (commitTimestamp < thresholdTimestamp) {
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
            legacyRefactorCommits.push(commit);
            break;
          }
        }
      }
    }

    const chartData = [
      {
        id: "Legacy Refactor",
        color: "hsl(25, 70%, 50%)",
        data: legacyRefactorCommits.map((commit) => ({
          x: new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(commit.commit.author.date)),
          y: commit.stats.additions - commit.stats.deletions,
        })),
      },
    ];

    res.json(chartData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

/*I saw that there is two routes and metrics that need information from this endpoitng, 
so I (ALEHS) turn it into a fucntion, metrics that need it: Change Failure Rate & Pipeline and Stages */

const getActionRuns = async (ownerName, repoName, access_token) => {
  try {
    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${ownerName}/${repoName}/actions/runs`;
    const githubApiHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };

    const response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });
    console.log("Actions Runs: ", response.data);
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
router.get("/pipeline/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const runs = await getActionRuns(username, repo_name, access_token);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/releases/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${username}/${repo_name}/releases`;
    const githubApiHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };

    const response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });
    console.log("Releases: ", response.data);
    res.json(response.data);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred getting deployments data" });
  }
});

module.exports = router;
