const natural = require('natural');

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

// Compute a match score (0-100) between user skills and a job
function scoreJob(userSkills, job) {
  if (!userSkills || userSkills.length === 0) return 50; // default score if no resume

  const tfidf = new TfIdf();
  const jobText = [job.title, job.description, ...(job.tags || [])].join(' ').toLowerCase();
  tfidf.addDocument(jobText);

  let totalScore = 0;
  let matched = 0;

  for (const skill of userSkills) {
    const score = tfidf.tfidf(skill.toLowerCase(), 0);
    if (score > 0) {
      matched++;
      totalScore += Math.min(score, 10); // cap per skill
    }
  }

  // Skill match ratio (0-60 points)
  const skillRatio = userSkills.length > 0 ? matched / userSkills.length : 0;
  const skillScore = Math.round(skillRatio * 60);

  // Tag overlap bonus (0-40 points)
  const jobTags = (job.tags || []).map(t => t.toLowerCase());
  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  const tagOverlap = jobTags.filter(t =>
    userSkillsLower.some(s => t.includes(s) || s.includes(t))
  ).length;
  const tagScore = Math.min(tagOverlap * 10, 40);

  const finalScore = Math.min(skillScore + tagScore, 100);
  return finalScore;
}

function scoreAllJobs(userSkills, jobs) {
  return jobs.map(job => ({
    ...job,
    matchScore: scoreJob(userSkills, job),
  }));
}

module.exports = { scoreJob, scoreAllJobs };
