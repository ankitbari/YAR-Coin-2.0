async function getRepoContributors(owner, repo) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contributors`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map(contributor => ({
    username: contributor.login,
    contributions: contributor.contributions,
    profileUrl: contributor.html_url,
    avatar: contributor.avatar_url
  }));
}

module.exports = { getRepoContributors };