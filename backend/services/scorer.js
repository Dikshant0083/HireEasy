const { extractSkills, skillMatcher } = require('./resumeParser');

const jobText = (job) => [job.title, ...(job.tags || []), job.description || ''].join(' \n ');

// Skills a job asks for, cached per job: extraction runs ~100 regexes over the description.
// shortcut: cache is cleared at 5000 entries; switch to an LRU if job volume grows a lot.
const jobSkillCache = new Map();
function jobSkills(job) {
  const key = `${job._id}:${job.updatedAt || job.posted_at || ''}`;
  let skills = jobSkillCache.get(key);
  if (!skills) {
    if (jobSkillCache.size > 5000) jobSkillCache.clear();
    skills = extractSkills(jobText(job));
    jobSkillCache.set(key, skills);
  }
  return skills;
}

// With fewer named skills a percentage is noise: one mention of "Python" would read as a 100% match.
const MIN_SKILLS_FOR_SCORE = 3;

/**
 * How much of what the job asks for the candidate has.
 * Returns { score: 0-100 | null, matched, missing }. score is null when the
 * listing names fewer than MIN_SKILLS_FOR_SCORE recognisable skills (e.g. most
 * scholarships); matched/missing are still returned so the UI can list them.
 */
function matchDetails(userSkills, job) {
  if (!userSkills?.length) return { score: null, matched: [], missing: [] };

  const text = jobText(job);
  const matched = userSkills.filter((s) => skillMatcher(s).test(text));
  const have = new Set(matched.map((s) => s.toLowerCase()));
  const missing = jobSkills(job).filter((s) => !have.has(s.toLowerCase()));
  const required = matched.length + missing.length;

  // Balance two questions (F1): how much of the listing you cover, and how much of your skillset it uses.
  // Coverage alone ranks a 3-skill Java internship (2/3) above a full-stack role using 6 of your skills.
  // Your side is capped at 10 skills so long resumes aren't penalised.
  const coverage = required ? matched.length / required : 0;
  const relevance = matched.length / Math.min(userSkills.length, 10);
  const f1 = matched.length ? (2 * coverage * Math.min(relevance, 1)) / (coverage + Math.min(relevance, 1)) : 0;

  return {
    score: required >= MIN_SKILLS_FOR_SCORE ? Math.round(f1 * 100) : null,
    matched,
    missing,
  };
}

const scoreJob = (userSkills, job) => matchDetails(userSkills, job).score;

module.exports = { scoreJob, matchDetails };
