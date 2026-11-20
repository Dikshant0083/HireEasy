const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Comprehensive skills dictionary for extraction
const SKILLS_DICT = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Dart', 'Perl',
  // Web Frontend
  'React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'HTML', 'CSS',
  'Tailwind', 'Bootstrap', 'SASS', 'SCSS', 'jQuery', 'Redux', 'GraphQL',
  // Backend
  'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Laravel',
  'Rails', 'ASP.NET', 'NestJS', 'Fastify',
  // Databases
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Elasticsearch',
  'DynamoDB', 'Cassandra', 'Firebase', 'Supabase', 'SQL',
  // Cloud & DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins',
  'GitHub Actions', 'CI/CD', 'Linux', 'Bash', 'Shell',
  // ML/AI
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow',
  'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Jupyter',
  'Data Science', 'Data Analysis', 'Statistics',
  // Mobile
  'Android', 'iOS', 'React Native', 'Flutter', 'Xamarin',
  // Tools
  'Git', 'GitHub', 'Jira', 'Figma', 'Photoshop', 'Illustrator', 'Canva',
  'Postman', 'Swagger', 'REST API', 'Microservices', 'Agile', 'Scrum',
  // Soft skills
  'Communication', 'Leadership', 'Problem Solving', 'Teamwork',
];

async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || '';
}

async function extractTextFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || '';
}

async function parseResume(filePath, mimetype) {
  let text = '';
  try {
    if (mimetype === 'application/pdf' || filePath.endsWith('.pdf')) {
      text = await extractTextFromPDF(filePath);
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filePath.endsWith('.docx')
    ) {
      text = await extractTextFromDOCX(filePath);
    } else {
      // Plain text fallback
      text = fs.readFileSync(filePath, 'utf8');
    }
  } catch (err) {
    console.error('Resume parse error:', err.message);
    return [];
  }

  return extractSkills(text);
}

// Short or common-word skills ("C", "R", "Go", "Rust", "Express", "Swift"…) only count
// when written with their usual capitalisation, so "go to market" or "R&D" don't match.
const CASE_SENSITIVE = new Set(['C', 'R', 'Go', 'Rust', 'Express', 'Swift', 'Dart', 'Shell', 'Rails', 'Ruby', 'Perl', 'Bash']);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Word boundaries that treat "+", "#" and "." as part of a skill, so "Java" never
// matches inside "JavaScript" and "C" never matches inside "C++" or "C#".
const toRe = (skill, flags) =>
  new RegExp('(?<![\\w+#.&])' + escapeRe(skill) + '(?![\\w+#&]|\\.\\w)', flags);

// Skills that are also everyday words need context, not just capitalisation:
// "Express" alone is usually the verb or "American Express", not the Node.js framework.
const CONTEXT_RE = {
  Express: /\bExpress(?:\.?js)\b|\b(?:Node(?:\.js)?|NodeJS|Mongo\w*|React|MERN|MEAN|REST)\b[^.\n]{0,30}\bExpress\b|\bExpress\b[^.\n]{0,30}\b(?:Node(?:\.js)?|NodeJS|Mongo\w*|MERN|MEAN)\b/i,
};

const MATCHERS = SKILLS_DICT.map((skill) => ({
  skill,
  re: CONTEXT_RE[skill] || toRe(skill, CASE_SENSITIVE.has(skill) ? '' : 'i'),
}));

function extractSkills(text = '') {
  return MATCHERS.filter(({ re }) => re.test(text)).map(({ skill }) => skill);
}

// Matcher for one user skill (may be outside the dictionary, e.g. edited by hand).
function skillMatcher(skill) {
  const known = MATCHERS.find((m) => m.skill.toLowerCase() === skill.toLowerCase());
  return known ? known.re : toRe(skill, 'i');
}

module.exports = { parseResume, extractSkills, skillMatcher };
