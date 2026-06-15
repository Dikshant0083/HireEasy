/**
 * Job Aggregator — real-time jobs from multiple APIs.
 *
 * Free sources (no key):
 *   - Remotive      → remote tech jobs globally
 *   - Arbeitnow     → global + European jobs
 *   - The Muse      → tech company jobs globally
 *
 * API-key sources:
 *   - JSearch       → scrapes Indeed, LinkedIn, Glassdoor (JSEARCH_API_KEY via RapidAPI)
 *                     Sign up: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 *   - Jooble        → global job board, India coverage (JOOBLE_API_KEY)
 *                     Sign up: https://jooble.org/api/about
 *
 * Uses Node.js native https/http — zero extra dependencies.
 */
const https = require('https');
const http  = require('http');
const JobCache = require('../models/JobCache');

const CACHE_TTL_MS = 45 * 60 * 1000; // 45 minutes

// ── HTTP GET helper ──────────────────────────────────────────────────────────
function httpGet(url, headers = {}, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: { 'User-Agent': 'HireEasy/1.0', Accept: 'application/json', ...headers },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpGet(res.headers.location, headers, timeoutMs));
      }
      if (res.statusCode === 429) return reject(new Error(`Rate limit (429) — slow down`));
      if (res.statusCode === 403) return reject(new Error(`Forbidden (403) — check API key or quota`));
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`Timeout: ${url.split('?')[0]}`)));
  });
}

// ── HTTP POST helper ─────────────────────────────────────────────────────────
function httpPost(url, body, headers = {}, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const lib = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'User-Agent': 'HireEasy/1.0',
        Accept: 'application/json',
        ...headers,
      },
    };
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('Timeout')));
    req.write(bodyStr);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
}

// ── Bulk upsert ──────────────────────────────────────────────────────────────
async function upsertJobs(jobs, source = '') {
  if (!jobs.length) return 0;
  const ops = jobs.map((j) => ({
    updateOne: {
      filter: { external_id: j.external_id },
      update: { $set: j },
      upsert: true,
    },
  }));
  const result = await JobCache.bulkWrite(ops, { ordered: false });
  const newCount = result.upsertedCount || 0;

  // Emit real-time notification if new jobs were added
  if (newCount > 0 && global._io) {
    global._io.to('all').emit('new_jobs', {
      count: newCount,
      source,
      message: `${newCount} new ${source} job${newCount > 1 ? 's' : ''} just arrived!`,
    });
  }
  return newCount;
}

async function isCacheFresh(source) {
  const count = await JobCache.countDocuments({ source, expires_at: { $gt: new Date() } });
  return count > 5;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Normalizers
// ═══════════════════════════════════════════════════════════════════════════════

function normalizeRemotive(job) {
  return {
    external_id: `remotive_${job.id}`,
    source: 'remotive',
    type: (job.job_type || '').toLowerCase().includes('intern') ? 'internship' : 'job',
    title: job.title || '',
    company: job.company_name || '',
    company_logo: job.company_logo || null,
    description: stripHtml(job.description || ''),
    tags: (job.tags || []).slice(0, 12),
    location: job.candidate_required_location || 'Worldwide',
    salary: job.salary || '',
    job_type: job.job_type || 'full_time',
    apply_url: job.url || '',
    is_remote: true,
    posted_at: new Date(job.publication_date || Date.now()),
    expires_at: new Date(Date.now() + CACHE_TTL_MS),
  };
}

function normalizeArbeitnow(job) {
  const isIntern = (job.job_types || []).some((t) =>
    ['student', 'intern', 'werkstudent', 'ausbildung', 'trainee'].some((k) => t.toLowerCase().includes(k))
  );
  return {
    external_id: `arbeitnow_${job.slug}`,
    source: 'arbeitnow',
    type: isIntern ? 'internship' : 'job',
    title: job.title || '',
    company: job.company_name || '',
    company_logo: null,
    description: stripHtml(job.description || ''),
    tags: (job.tags || []).slice(0, 12),
    location: job.location || 'Remote',
    salary: '',
    job_type: (job.job_types || []).join(', ') || 'full_time',
    apply_url: job.url || '',
    is_remote: job.remote === true,
    posted_at: job.created_at ? new Date(job.created_at * 1000) : new Date(),
    expires_at: new Date(Date.now() + CACHE_TTL_MS),
  };
}

function normalizeMuse(job) {
  const locs = (job.locations || []).map((l) => l.name).join(', ') || 'Remote';
  return {
    external_id: `muse_${job.id}`,
    source: 'themuse',
    type: 'job',
    title: job.name || '',
    company: job.company?.name || '',
    company_logo: job.company?.refs?.logo_image || null,
    description: stripHtml(job.contents || ''),
    tags: [
      ...(job.categories || []).map((c) => c.name),
      ...(job.levels || []).map((l) => l.name),
    ].slice(0, 12),
    location: locs,
    salary: '',
    job_type: 'full_time',
    apply_url: job.refs?.landing_page || '',
    is_remote: locs.toLowerCase().includes('remote') || locs.toLowerCase().includes('flexible'),
    posted_at: new Date(job.publication_date || Date.now()),
    expires_at: new Date(Date.now() + CACHE_TTL_MS),
  };
}

/**
 * JSearch normalizer
 * API: https://jsearch.p.rapidapi.com/search
 * Fields: job_id, job_title, employer_name, employer_logo, employer_website,
 *   job_description, job_is_remote, job_apply_link, job_city, job_state,
 *   job_country, job_employment_type, job_required_skills, job_posted_at_datetime_utc,
 *   job_min_salary, job_max_salary, job_salary_currency
 */
function normalizeJSearch(job) {
  const titleLower = (job.job_title || '').toLowerCase();
  const isIntern = titleLower.includes('intern') || titleLower.includes('trainee') || titleLower.includes('apprentice');

  const loc = [job.job_city, job.job_state, job.job_country]
    .filter(Boolean).join(', ') || 'Remote';

  // Build salary string
  let salary = '';
  if (job.job_min_salary) {
    const currency = job.job_salary_currency || '$';
    salary = `${currency}${Number(job.job_min_salary).toLocaleString()}${job.job_max_salary ? `–${Number(job.job_max_salary).toLocaleString()}` : '+'}`;
  }

  return {
    external_id: `jsearch_${job.job_id}`,
    source: 'jsearch',
    type: isIntern ? 'internship' : 'job',
    title: job.job_title || '',
    company: job.employer_name || '',
    company_logo: job.employer_logo || null,
    description: (job.job_description || '').slice(0, 2000),
    tags: (job.job_required_skills || []).slice(0, 12),
    location: loc,
    salary,
    job_type: (job.job_employment_type || 'FULLTIME').replace(/-/g, '_').toLowerCase(),
    apply_url: job.job_apply_link || '',
    is_remote: job.job_is_remote === true,
    posted_at: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : new Date(),
    expires_at: new Date(Date.now() + CACHE_TTL_MS),
  };
}

function normalizeJooble(job) {
  const id = Buffer.from((job.link || job.title + job.company || String(Math.random())))
    .toString('base64').slice(0, 24);
  return {
    external_id: `jooble_${id}`,
    source: 'jooble',
    type: (job.type || '').toLowerCase().includes('intern') ? 'internship' : 'job',
    title: job.title || '',
    company: job.company || '',
    company_logo: null,
    description: stripHtml(job.snippet || ''),
    tags: (job.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 12),
    location: job.location || 'India',
    salary: job.salary || '',
    job_type: job.type || 'full_time',
    apply_url: job.link || '',
    is_remote: (job.location || '').toLowerCase().includes('remote'),
    posted_at: job.updated ? new Date(job.updated) : new Date(),
    expires_at: new Date(Date.now() + CACHE_TTL_MS),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Fetchers
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchRemotive() {
  console.log('🌐 Fetching Remotive...');
  const cats = ['software-dev', 'devops-sysadmin', 'data', 'design', 'product'];
  const results = await Promise.allSettled(
    cats.map((c) => httpGet(`https://remotive.com/api/remote-jobs?category=${c}&limit=50`))
  );
  let all = [];
  results.forEach((r) => { if (r.status === 'fulfilled') all.push(...(r.value.jobs || [])); });
  const seen = new Set();
  all = all.filter((j) => { if (seen.has(j.id)) return false; seen.add(j.id); return true; });
  const jobs = all.map(normalizeRemotive);
  await upsertJobs(jobs, 'remotive');
  console.log(`✅ Remotive: ${jobs.length} jobs`);
}

async function fetchArbeitnow() {
  console.log('🌐 Fetching Arbeitnow...');
  const pages = await Promise.allSettled([1, 2, 3].map((p) =>
    httpGet(`https://www.arbeitnow.com/api/job-board-api?page=${p}`)
  ));
  let all = [];
  pages.forEach((r) => { if (r.status === 'fulfilled') all.push(...(r.value.data || [])); });
  const jobs = all.slice(0, 300).map(normalizeArbeitnow);
  await upsertJobs(jobs, 'arbeitnow');
  console.log(`✅ Arbeitnow: ${jobs.length} jobs`);
}

async function fetchTheMuse() {
  console.log('🌐 Fetching The Muse...');
  const cats = ['Software Engineer', 'Data Science', 'Product Management', 'Design & UX', 'DevOps & Infrastructure'];
  const results = await Promise.allSettled(
    cats.map((cat) =>
      httpGet(`https://www.themuse.com/api/public/jobs?category=${encodeURIComponent(cat)}&level=Entry+Level&level=Mid+Level&level=Senior+Level&page=0&descending=true`)
    )
  );
  let all = [];
  results.forEach((r) => { if (r.status === 'fulfilled') all.push(...(r.value.results || [])); });
  const seen = new Set();
  all = all.filter((j) => { if (seen.has(j.id)) return false; seen.add(j.id); return true; });
  const jobs = all.map(normalizeMuse);
  await upsertJobs(jobs, 'themuse');
  console.log(`✅ The Muse: ${jobs.length} jobs`);
}

/**
 * JSearch via RapidAPI — scrapes Indeed, LinkedIn, Glassdoor.
 * Endpoint: GET https://jsearch.p.rapidapi.com/search
 * Requires: JSEARCH_API_KEY in .env
 * Free tier: 200 req/month → fetch sequentially with 2s gap to avoid 429
 */
async function fetchJSearch() {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) {
    console.log('ℹ️  JSearch skipped — set JSEARCH_API_KEY in .env');
    return;
  }

  console.log('🌐 Fetching JSearch (Indeed/LinkedIn/Glassdoor)...');

  const HEADERS = {
    'x-rapidapi-host': 'jsearch.p.rapidapi.com',
    'x-rapidapi-key': apiKey,
    'Content-Type': 'application/json',
  };

  // Targeted searches — India + global remote, recent jobs only
  const queries = [
    'software engineer in India',
    'data engineer in India',
    'frontend developer in India',
    'backend developer in India',
    'data scientist in India',
    'full stack developer in India',
    'devops engineer in India',
    'machine learning engineer remote',
    'software engineer remote',
    'cloud engineer remote',
  ];

  let all = [];
  for (let i = 0; i < queries.length; i++) {
    try {
      const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(queries[i])}&page=1&num_pages=1&date_posted=month`;
      const data = await httpGet(url, HEADERS, 15000);
      const jobs = data.data || [];
      all.push(...jobs);
      console.log(`  📥 "${queries[i]}": ${jobs.length} jobs`);
    } catch (e) {
      console.warn(`  ⚠️  JSearch "${queries[i]}": ${e.message}`);
      // If rate limited, stop early to save quota
      if (e.message.includes('429') || e.message.includes('403')) break;
    }
    // 2s between requests to respect rate limit
    if (i < queries.length - 1) await sleep(2000);
  }

  // Deduplicate by job_id
  const seen = new Set();
  all = all.filter((j) => {
    if (seen.has(j.job_id)) return false;
    seen.add(j.job_id);
    return true;
  });

  const jobs = all.map(normalizeJSearch);
  await upsertJobs(jobs);
  console.log(`✅ JSearch: ${jobs.length} jobs cached`);
}

/**
 * Jooble — global job board, India coverage.
 * Requires: JOOBLE_API_KEY in .env (free — register at https://jooble.org/api/about)
 */
async function fetchJooble() {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    console.log('ℹ️  Jooble skipped — set JOOBLE_API_KEY in .env');
    return;
  }
  console.log('🌐 Fetching Jooble...');
  const searches = [
    { keywords: 'software engineer', location: 'India' },
    { keywords: 'data scientist',    location: 'India' },
    { keywords: 'web developer',     location: 'India' },
  ];
  const results = await Promise.allSettled(
    searches.map((s) =>
      httpPost(`https://jooble.org/api/${apiKey}`, {
        keywords: s.keywords, location: s.location, page: '1', SearchMode: '1',
      })
    )
  );
  let all = [];
  results.forEach((r) => {
    if (r.status === 'fulfilled') all.push(...(r.value.jobs || []));
    else console.warn('⚠️ Jooble partial fail:', r.reason?.message);
  });
  const seen = new Set();
  all = all.filter((j) => { if (seen.has(j.link)) return false; seen.add(j.link); return true; });
  const jobs = all.map(normalizeJooble);
  await upsertJobs(jobs);
  console.log(`✅ Jooble: ${jobs.length} jobs`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main refresh — called before every /api/jobs request
// ═══════════════════════════════════════════════════════════════════════════════
let refreshing = false;

async function refreshJobsIfStale() {
  if (refreshing) return;
  try {
    refreshing = true;
    const [remotiveFresh, arbeitnowFresh, museFresh, jsearchFresh, joobleFresh] = await Promise.all([
      isCacheFresh('remotive'),
      isCacheFresh('arbeitnow'),
      isCacheFresh('themuse'),
      isCacheFresh('jsearch'),
      isCacheFresh('jooble'),
    ]);

    const fetches = [];
    if (!remotiveFresh)  fetches.push(fetchRemotive().catch((e) => console.error('⚠️ Remotive:', e.message)));
    if (!arbeitnowFresh) fetches.push(fetchArbeitnow().catch((e) => console.error('⚠️ Arbeitnow:', e.message)));
    if (!museFresh)      fetches.push(fetchTheMuse().catch((e) => console.error('⚠️ The Muse:', e.message)));
    if (process.env.JSEARCH_API_KEY && !jsearchFresh)
      fetches.push(fetchJSearch().catch((e) => console.error('⚠️ JSearch:', e.message)));
    if (process.env.JOOBLE_API_KEY && !joobleFresh)
      fetches.push(fetchJooble().catch((e) => console.error('⚠️ Jooble:', e.message)));

    if (fetches.length > 0) {
      console.log(`🔄 Refreshing ${fetches.length} source(s)...`);
      await Promise.allSettled(fetches);
    }
  } finally {
    refreshing = false;
  }
}

// Auto-refresh 4s after server start
setTimeout(() => refreshJobsIfStale().catch(console.error), 4000);

module.exports = {
  refreshJobsIfStale,
  fetchRemotive, fetchArbeitnow, fetchTheMuse, fetchJSearch, fetchJooble,
};
