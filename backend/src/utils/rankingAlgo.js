const rankWorkers = (workers, project) => {
  return workers.map((worker) => {
    let score = 0;

    // Skill match (30%)
    const skillMatch = worker.skills.some(
      s => s.toLowerCase() === project.skill.toLowerCase()
    );
    score += skillMatch ? 30 : 0;

    // Rating (20%) — max 5 stars
    score += (worker.avgRating / 5) * 20;

    // Completion rate (20%) — normalized to 100 jobs max
    const completionScore = Math.min(worker.totalJobsDone / 100, 1) * 20;
    score += completionScore;

    // Distance approximation (15%) — same location = full score
    const locationMatch = worker.location?.toLowerCase() === project.location?.toLowerCase();
    score += locationMatch ? 15 : 5;

    // Reliability / profile completeness (15%)
    score += (worker.completionScore / 100) * 15;

    // New worker boost — if fewer than 10 jobs, add 10 bonus points
    if (worker.totalJobsDone < 10) score += 10;

    return { worker, score: parseFloat(score.toFixed(2)) };
  }).sort((a, b) => b.score - a.score);
};

module.exports = { rankWorkers };