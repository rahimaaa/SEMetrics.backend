const axios = require("axios");
const router = require("express").Router();

// Helper function to fetch the list of deployments from the GitHub API.
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
        console.log('Error fetching deployments:', error);
        return null;
    }
};

// Helper function to calculate the deployment frequency.
const calculateDeploymentFrequency = (deployments) => {
    if (!deployments || !deployments.length) {
        return { averageFrequency: 0, graphData: [] };
    }

    const earliestDeploymentDate = new Date(deployments[deployments.length - 1].created_at);
    const daysSinceFirstDeployment = (new Date() - earliestDeploymentDate) / (1000 * 60 * 60 * 24);
    const averageFrequency = deployments.length / daysSinceFirstDeployment;

    const data = {
        id: 'frequency',
        color: averageFrequency > 0.5 ? "green" : averageFrequency > 0.3 ? "blue" : averageFrequency > 0.1 ? "yellow" : "red",
        data: Array.from({ length: Math.ceil(daysSinceFirstDeployment) }, (_, idx) => {
            return {
                x: new Date(earliestDeploymentDate.getTime() + idx * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                y: idx + 1
            };
        })
    };

    return {
        averageFrequency,
        graphData: [data]
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
        console.log('Error calculating deployment frequency:', error);
        res.status(500).json({ error: "An error occurred calculating deployment frequency" });
    }
});

module.exports = router;
