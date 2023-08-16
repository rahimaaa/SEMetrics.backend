const router = require("express").Router();
const axios = require("axios");

router.get("/change-failure-rate/:repo_name", async(req, res)=>{
    try {
        const { repo_name } = req.params;
        const {username, access_token} = req.body;

        if(!username || !repo_name || !access_token){
            return res.status(400).send("Cannot Fetch Change Failure Rate");
        }
        const githubApiUrl = `${process.env.GITHUB_BASE_URL}/repos/${username}/${repo_name}/actions/run`;
        const githubApiHeaders = {
            accept: 'application/json',
            Authorization : `Bearer ${access_token}`,
        }
        const response = await axios.get(githubApiUrl,{
            headers: githubApiHeaders,
        })
        const workflowRuns = response.data.workflow_runs;
        const totalRuns = workflowRuns.length;
        const failedRuns = workflowRuns.filter(run => run.conclusion === 'failure').length;
        console.log("Work Flow Runs:", workflowRuns);
        console.log("Total Runs:", totalRuns);
        console.log("Failed Runs:", failedRuns);
        
        // Calculate change failure rate
        const changeFailureRate = (failedRuns / totalRuns) * 100;
        console.log("Change failure rate:", changeFailureRate);
    } catch (error) {
        console.log('Error fetching data from Github API:', error)
    }
})

module.exports =  router;