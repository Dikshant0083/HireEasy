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

function extractSkills(text) {
  const normalized = text.toLowerCase();
  const found = new Set();

  for (const skill of SKILLS_DICT) {
    // Match whole word, case-insensitive
    const pattern = new RegExp(`\\b${skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (pattern.test(normalized)) {
      found.add(skill);
    }
  }

  return Array.from(found);
}

module.exports = { parseResume, extractSkills };
