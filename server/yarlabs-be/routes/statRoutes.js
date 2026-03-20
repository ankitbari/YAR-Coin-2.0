const express = require("express");
const Router = express.Router();

const asyncHandler = require('../utils/asyncHandler');
const { getRepoContributors } = require("../utils/githubService");

Router.get("/repo/:owner/:repo", asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const contributors = await getRepoContributors(owner, repo);
  res.json({ success: true, message: "Contributors fetched successfully...!", data: contributors });
}));

module.exports = Router;