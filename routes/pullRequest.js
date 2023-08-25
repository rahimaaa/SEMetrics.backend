const router = require("express").Router();
const axios = require("axios");
const timeToMergeRouter = require("./timeToMerge");

router.use("/time-to-merge", timeToMergeRouter);

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

const getPullRequestComments = async (
  owner,
  access_token,
  repo_name,
  pullNumber
) => {
  try {
    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${owner}/${repo_name}/issues/${pullNumber}/comments`;
    const githubApiHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };

    const response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching pull request comments:", error);
    return [];
  }
};

const getPullRequestCommits = async (
  username,
  access_token,
  repo_name,
  pull_number
) => {
  const apiUrl = `https://api.github.com/repos/${username}/${repo_name}/pulls/${pull_number}/commits`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching pull request commits:", error);
    throw error;
  }
};

router.get("/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const pulls = await getPullRequestList(username, access_token, repo_name);
    res.json(pulls);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/time_first_comment/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const pulls = await getPullRequestList(username, access_token, repo_name);

    let totalHours = 0;
    let totalMinutes = 0;
    let totalCount = 0;
    const chartData = [];

    for (const pull of pulls) {
      const comments = await getPullRequestComments(
        username,
        access_token,
        repo_name,
        pull.number
      );

      if (comments.length > 0) {
        const createdTimestamp = new Date(pull.created_at).getTime();
        const firstCommentTimestamp = new Date(
          comments[0].created_at
        ).getTime();

        const timeDifferenceInMinutes =
          (firstCommentTimestamp - createdTimestamp) / (1000 * 60);

        totalHours += timeDifferenceInMinutes / 60;
        totalMinutes += timeDifferenceInMinutes % 60;
        totalCount++;
        chartData.push({
          x: new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(pull.created_at)),
          y: timeDifferenceInMinutes.toFixed(2),
        });
      }
    }

    const averageTimeInMinutes = (totalHours * 60 + totalMinutes) / totalCount;
    const averageTimeString = `${Math.floor(averageTimeInMinutes / 60)}.${(
      averageTimeInMinutes % 60
    ).toFixed(2)}`;
    console.log(
      `totalhours: ${totalHours}, totalCount: ${totalCount}, totalMins ${totalMinutes}, avg: ${
        averageTimeInMinutes / 60
      }, avg: in String: ${averageTimeString}`
    );
    const chartDataFormatted = [
      {
        id: "Time to First Comment",
        color: "hsl(25, 70%, 50%)",
        data: chartData,
      },
    ];

    res.json({ averageTime: averageTimeString, chartData: chartDataFormatted });
  } catch (error) {
    console.log("Error getting avg time for first comment ", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/iteration-time/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const pulls = await getPullRequestList(username, access_token, repo_name);

    let totalIterationTime = 0;
    let totalCount = 0;

    for (const pull of pulls) {
      const iterationTime = await calculateIterationTime(
        pull,
        access_token,
        repo_name,
        username
      );
      totalIterationTime += iterationTime;
      totalCount++;
    }
    const averageIterationTime = totalIterationTime / totalCount;
    const chartData = [
      {
        id: "Iteration Time",
        color: "hsl(25, 70%, 50%)",
        data: await Promise.all(
          pulls.map(async (pull) => ({
            x: new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(pull.created_at)),
            y: await calculateIterationTime(
              pull,
              access_token,
              repo_name,
              username
            ),
          }))
        ),
      },
    ];

    res.json({ averageTime: averageIterationTime.toFixed(2), chartData });
  } catch (error) {
    console.error("Error getting average iteration time: ", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

const calculateIterationTime = async (
  pull,
  access_token,
  repo_name,
  username
) => {
  const comments = await getPullRequestComments(
    username,
    access_token,
    repo_name,
    pull.number
  );

  if (comments.length >= 2) {
    const firstCommentTimestamp = new Date(comments[0].created_at).getTime();
    const finalCommentTimestamp = new Date(
      comments[comments.length - 1].created_at
    ).getTime();
    const timeDifference = finalCommentTimestamp - firstCommentTimestamp;
    return timeDifference / (1000 * 60 * 60);
  }

  return 0;
};

async function getPullRequestReviews(
  username,
  access_token,
  repo_name,
  pull_number
) {
  try {
    const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${username}/${repo_name}/pulls/${pull_number}/reviews`;
    const githubApiHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };

    const response = await axios.get(githubApiUrl, {
      headers: githubApiHeaders,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching pull request comments:", error);
    return [];
  }
}

router.get("/unreview-pr/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const pulls = await getPullRequestList(username, access_token, repo_name);

    let totalPullRequests = 0;
    let unreviewedWithoutCommentsOrApproval = 0;

    for (const pull of pulls) {
      totalPullRequests++;

      const comments = await getPullRequestComments(
        username,
        access_token,
        repo_name,
        pull.number
      );

      const reviews = await getPullRequestReviews(
        username,
        access_token,
        repo_name,
        pull.number
      );

      const approved = reviews.some((review) => review.state === "APPROVED");

      if (comments.length === 0 && !approved) {
        unreviewedWithoutCommentsOrApproval++;
      }
      // if (comments.length === 0 && !pull.review_comments && !pull.approvals) {
      //   unreviewedWithoutCommentsOrApproval++;
      // }
    }

    const unreviewedPercentage =
      (unreviewedWithoutCommentsOrApproval / totalPullRequests) * 100;

    const chartData = [
      {
        id: "Total Pull Requests",
        label: "Total Pull Requests",
        value: totalPullRequests,
        color: "hsl(351, 70%, 50%)",
        fill: "dots",
      },
      {
        id: "Unreviewed Without Comments/Approval",
        label: "Unreviewed Without Comments/Approval",
        value: unreviewedWithoutCommentsOrApproval,
        color: "hsl(237, 70%, 50%)",
      },
    ];
    const fillData = [
      {
        match: {
          id: "Total Pull Requests",
        },
        id: "dots",
      },
      {
        match: {
          id: "Unreviewed Without Comments/Approval",
        },
        id: "dots",
      },
    ];
    res.json({
      unreviewedPercentage: unreviewedPercentage.toFixed(2),
      chartData,
      fillData,
    });
  } catch (error) {
    console.error("Error calculating unreviewed PRs: ", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

function calculateAverageResponseTime(comments) {
  if (comments.length === 0) {
    return 0;
  }

  let totalResponseTime = 0;

  for (const comment of comments) {
    const createdAt = new Date(comment.created_at);
    const updatedAt = new Date(comment.updated_at);
    const responseTime = updatedAt - createdAt;
    totalResponseTime += responseTime;
  }

  return totalResponseTime / comments.length;
}

function getColor(avgResponseTime) {
  // Define thresholds for different categories
  const excellentThreshold = 24 * 3600 * 1000; // 24 hours in milliseconds
  const goodThreshold = 48 * 3600 * 1000; // 48 hours in milliseconds
  const mediumRiskThreshold = 72 * 3600 * 1000; // 72 hours in milliseconds

  if (avgResponseTime <= excellentThreshold) {
    return "hsl(125, 70%, 50%)"; // Excellent (Green)
  } else if (avgResponseTime <= goodThreshold) {
    return "hsl(270, 70%, 50%)"; // Good (Blue)
  } else if (avgResponseTime <= mediumRiskThreshold) {
    return "hsl(45, 70%, 50%)"; // Medium Risk (Yellow)
  } else {
    return "hsl(0, 70%, 50%)"; // High Risk (Red)
  }
}
function formatResponseTime(avgResponseTime) {
  const hours = Math.floor(avgResponseTime / 3600); // 3600 seconds in an hour
  const minutes = Math.floor((avgResponseTime % 3600) / 60); // Remaining seconds converted to minutes
  return `${hours}.${minutes}`;
}
router.get("/responsiveness/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const pulls = await getPullRequestList(username, access_token, repo_name);

    const responseData = [];
    const keys = [];

    for (const pull of pulls) {
      const comments = await getPullRequestComments(
        username,
        access_token,
        repo_name,
        pull.number
      );

      const avgResponseTime = calculateAverageResponseTime(comments);
      const formattedAvgResponseTime = formatResponseTime(avgResponseTime);

      responseData.push({
        PR: `PR #${pull.number}`,
        [`#${pull.number}`]: formattedAvgResponseTime,
        [`#${pull.number}Color`]: getColor(avgResponseTime),
      });
      keys.push(`#${pull.number}`);
    }

    res.json({ chartData: responseData, keys: keys });
  } catch (error) {
    console.error("Error calculating responsiveness:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

const calculateFollowOnCommitColor = (followOnCommitCount) => {
  if (followOnCommitCount >= 10) {
    return "hsl(0, 70%, 50%)"; // High Risk (Red)
  } else if (followOnCommitCount >= 5) {
    return "hsl(45, 70%, 50%)"; // Medium Risk (Yellow)
  } else if (followOnCommitCount >= 3) {
    return "hsl(270, 70%, 50%)"; // Good (Blue)
  } else {
    return "hsl(125, 70%, 50%)"; // Elite (Green)
  }
};

const calculateFollowOnCommitsData = async (
  username,
  access_token,
  repo_name
) => {
  const pulls = await getPullRequestList(username, access_token, repo_name);
  const chartData = [];
  const keys = [];
  for (const pull of pulls) {
    const commits = await getPullRequestCommits(
      username,
      access_token,
      repo_name,
      pull.number
    );

    const followOnCommitCount = commits.length;

    const color = calculateFollowOnCommitColor(followOnCommitCount);

    chartData.push({
      PR: `PR #${pull.number}`,
      [`${commits[0].sha.substring(0, 7)}`]: followOnCommitCount,
      [`${commits[0].sha.substring(0, 7)}Color`]: color,
    });
    keys.push(`${commits[0].sha.substring(0, 7)}`);
  }

  return { chartData, keys };
};

router.get("/follow-on-commits/:repo_name", async (req, res, next) => {
  try {
    const { repo_name } = req.params;
    const { username, access_token } = req.user;

    const responseData = await calculateFollowOnCommitsData(
      username,
      access_token,
      repo_name
    );

    res.json({ chartData: responseData.chartData, keys: responseData.keys });
  } catch (error) {
    console.error("Error calculating follow-on commits:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
