const axios = require("axios");
const router = require("express").Router();

app.get("/MeanTimeToReport/:repo_name", async (req, res, next) => {
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

    const issues = response.data;

    const resolvedIssues = issues.filter((issue) => issue.state === "closed");

    const mttrValues = resolvedIssues.map((issue) => {
      const creationTime = new Date(issue.created_at).getTime();
      const closureTime = new Date(issue.closed_at).getTime();

      const timeDifferenceInHours =
        (closureTime - creationTime) / (1000 * 60 * 60);
      return timeDifferenceInHours;
    });

    const totalMTTR = mttrValues.reduce((sum, value) => sum + value, 0);
    const meanMTTR = totalMTTR / mttrValues.length;

    const chartData = [
      {
        id: "MeanTimeToReport",
        color: "hsl(25, 70%, 50%)",
        data: meanMTTR.map((item) => ({
          x: new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(item.date)),
          y: item.mttr,
        })),
      },
    ];

    res.json({ chartData });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;