const axios = require("axios");
const router = require("express").Router();
const reworkRouter = require("./rework");
const meanTimeToRestoreRouter = require("./MeanTimeToRestore");

router.use("/pulls", require("./pullRequest"));
router.use("/change-failure-rate", require("./changeFailureRate"));
router.use("/rework", reworkRouter);
router.use("/mean-time-to-restore", meanTimeToRestoreRouter);

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
  const impactDataMap = new Map(); // Use a Map to group data by date and calculate averages
  commits.forEach((commit) => {
    const { stats, files } = commit;
    const additions = stats.additions;
    const deletions = stats.deletions;
    const totalChanges = additions + deletions;
    const affectedFiles = files.map((file) => file.filename);
    const impact = totalChanges * affectedFiles.length * 0.1;
    const commitDate = new Date(commit.commit.author.date);
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(commitDate);

    // Check if this date already exists in the Map
    if (impactDataMap.has(formattedDate)) {
      // If it exists, update the average impact
      const existingData = impactDataMap.get(formattedDate);
      existingData.totalImpact += impact;
      existingData.count += 1;
    } else {
      // If it doesn't exist, create a new entry
      impactDataMap.set(formattedDate, {
        date: formattedDate,
        totalImpact: impact,
        count: 1,
        files: affectedFiles,
      });
    }
  });

  // Convert the Map values (averaged data) to an array
  const impactData = Array.from(impactDataMap.values()).map((item) => ({
    date: item.date,
    impact: item.totalImpact / item.count, // Calculate the average impact
    files: item.files,
  }));

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
        color: "hsl(240, 70%, 50%)", // Line color (you can set it as needed)
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

router.get("/contributors/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${username}/${repo_name}/contributors`;
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
  const data = commits.map((commit) => {
    const totalChanges = commit.stats.additions + commit.stats.deletions;
    const filesChanged = commit.files.length;
    const commitComplexity = totalChanges * filesChanged;

    // Determine the color based on commit complexity
    const color = getComplexityColor(commitComplexity);

    // Shorten the commit identifier
    const commitIdentifier = commit.sha.substring(0, 7);

    return {
      commit: commitIdentifier,
      [`${commitIdentifier}`]: commitComplexity,
      [`${commitIdentifier}Color`]: color,
    };
  });

  return data;
};

const getComplexityColor = (complexity) => {
  // Define thresholds for different complexity levels
  const eliteThreshold = 500;
  const goodThreshold = 300;
  const mediumRiskThreshold = 100;

  // Determine the color based on complexity
  if (complexity >= eliteThreshold) {
    return "hsl(125, 70%, 50%)"; // Elite (Green)
  } else if (complexity >= goodThreshold) {
    return "hsl(270, 70%, 50%)"; // Good (Blue)
  } else if (complexity >= mediumRiskThreshold) {
    return "hsl(45, 70%, 50%)"; // Medium Risk (Yellow)
  } else {
    return "hsl(0, 70%, 50%)"; // High Risk (Red)
  }
};

router.get("/complexity/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const commits = await getRepoCommits(username, repo_name, access_token);

    const chartData = calculateCommitComplexity(commits);
    const keys = commits.map((commit) => commit.sha.substring(0, 7));

    res.json({ chartData: chartData, keys: keys });
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

    const thresholdDays = 3; // 3 days for us will be considered refactor
    const thresholdTimestamp = Date.now() - thresholdDays * 24 * 60 * 60 * 1000;

    let refactorCount = 0;
    let notRefactorCount = 0;

    for (const commit of commits) {
      const commitTimestamp = new Date(commit.commit.author.date).getTime();

      if (commitTimestamp < thresholdTimestamp) {
        const impact = commit.stats.additions - commit.stats.deletions;

        if (impact > 0) {
          refactorCount += 1;
        } else {
          notRefactorCount += 1;
        }
      }
    }

    const chartData = [
      {
        id: "commits affecting code",
        label: "commits affecting code",
        value: refactorCount,
        color: "hsl(207, 70%, 50%)",
      },
      {
        id: "commits not affecting code",
        label: "commits not affecting code",
        value: notRefactorCount,
        color: "hsl(228, 70%, 50%)",
      },
    ];

    const fill = [
      {
        match: {
          id: "commits affecting code",
        },
        id: "dots",
      },
      {
        match: {
          id: "commits not affecting code",
        },
        id: "lines",
      },
    ];

    res.json({ chartData: chartData, fill: fill });
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

const getDeployments = async (ownerName, repoName, access_token) => {
  try {
    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${ownerName}/${repoName}/deployments`;
    const githubApiHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };

    const response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });

    return response.data;
  } catch (error) {
    console.log("Error fetching deployments:", error);
    return null;
  }
};

// Helper function to calculate the deployment frequency.

const calculateDeploymentFrequency = (deployments) => {
  if (!deployments || !deployments.length) {
    return { averageFrequency: 0, graphData: [] };
  }

  const earliestDeploymentDate = new Date(
    deployments[deployments.length - 1].created_at
  );
  const currentDate = new Date();
  const daysSinceFirstDeployment =
    (currentDate - earliestDeploymentDate) / (1000 * 60 * 60 * 24);

  // Create an object to store the daily deployment counts
  const deploymentCounts = {};

  // Iterate through deployments and count them per day
  deployments.forEach((deployment) => {
    const deploymentDate = new Date(deployment.created_at)
      .toISOString()
      .split("T")[0];

    if (deploymentCounts[deploymentDate]) {
      deploymentCounts[deploymentDate]++;
    } else {
      deploymentCounts[deploymentDate] = 1;
    }
  });

  // Convert the counts into data points for the chart
  const data = Object.entries(deploymentCounts).map(([date, count]) => ({
    x: date,
    y: count,
  }));

  const averageFrequency = deployments.length / daysSinceFirstDeployment;

  const graphData = [
    {
      id: "frequency",
      color:
        averageFrequency > 0.5
          ? "green"
          : averageFrequency > 0.3
          ? "blue"
          : averageFrequency > 0.1
          ? "yellow"
          : "red",
      data,
    },
  ];

  return {
    averageFrequency,
    graphData,
  };
};

router.get("/deployment-frequency/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const deployments = await getDeployments(username, repo_name, access_token);

    const frequencyData = calculateDeploymentFrequency(deployments);

    res.json(frequencyData);
  } catch (error) {
    console.log("Error calculating deployment frequency:", error);
    res
      .status(500)
      .json({ error: "An error occurred calculating deployment frequency" });
  }
});

module.exports = router;
