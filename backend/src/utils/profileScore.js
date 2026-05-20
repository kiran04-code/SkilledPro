const calculateProfileScore = (user) => {
  let score = 0;
  if (user.avatar) score += 10;
  if (user.skills && user.skills.length > 0) score += 20;
  if (user.bio) score += 10;
  if (user.portfolioUrls && user.portfolioUrls.length > 0) score += 20;
  if (user.location) score += 10;
  if (user.phoneVerified) score += 20;
  if (user.githubUrl) score += 10;
  return score;
};

module.exports = { calculateProfileScore };