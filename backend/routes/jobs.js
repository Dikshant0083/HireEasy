const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const authenticate = require('../middleware/authenticate');
const optAuth = require('../middleware/optionalAuth');
const JobCache = require('../models/JobCache');
const Application = require('../models/Application');
const { refreshJobsIfStale } = require('../services/jobAggregator');
const mongoose = require('mongoose');
const { scoreJob, matchDetails } = require('../services/scorer');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// CSV upload multer config
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `csv_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const csvUpload = multer({
  storage: csvStorage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.csv') cb(null, true);
    else cb(Object.assign(new Error('Only CSV files are allowed'), { statusCode: 400 }));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// GET /api/jobs — list all jobs with optional filters
router.get('/', optAuth, async (req, res, next) => {
  try {
    // Refresh real-time data if stale (non-blocking on subsequent requests)
    refreshJobsIfStale().catch(console.error);

    const { type, search, remote, source, sortBy = 'date' } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

    const filter = {};
    if (type && ['job', 'internship', 'scholarship'].includes(type)) filter.type = type;
    if (remote === 'true') filter.is_remote = true;
    if (source && ['remotive', 'arbeitnow', 'scholarship', 'csv', 'themuse', 'jsearch', 'jooble'].includes(source)) {
      filter.source = source;
    }
    if (search && String(search).trim()) {
      const rx = { $regex: escapeRegex(String(search).trim().slice(0, 100)), $options: 'i' };
      filter.$or = [{ title: rx }, { company: rx }, { tags: rx }, { description: rx }];
    }

    const userSkills = req.user ? (req.user.skills || []) : [];
    const scoreSort = sortBy === 'score' && userSkills.length > 0;

    let jobs, total;

    if (scoreSort) {
      // Score every matching job, then page. Jobs with no skill data sort last.
      const allJobs = await JobCache.find(filter).sort({ posted_at: -1, _id: -1 }).lean();
      const scored = allJobs.map(job => ({
        ...job,
        matchScore: scoreJob(userSkills, job),
      })).sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));

      total = scored.length;
      jobs = scored.slice((page - 1) * limit, page * limit);
    } else {
      total = await JobCache.countDocuments(filter);
      jobs = await JobCache.find(filter)
        .sort({ posted_at: -1, _id: -1 }) // _id breaks ties so pages never overlap
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      // Add match scores (not sorted by them)
      if (userSkills.length > 0) {
        jobs = jobs.map(job => ({ ...job, matchScore: scoreJob(userSkills, job) }));
      } else {
        jobs = jobs.map(job => ({ ...job, matchScore: null }));
      }
    }

    // Mark saved/applied jobs for authenticated users
    let actionsMap = {};
    if (req.user) {
      const apps = await Application.find({
        user_id: req.user._id,
        job_id: { $in: jobs.map(j => j._id) },
      }).lean();
      apps.forEach(a => {
        actionsMap[a.job_id.toString()] = actionsMap[a.job_id.toString()] || {};
        actionsMap[a.job_id.toString()][a.action] = true;
      });
    }

    const result = jobs.map(job => ({
      ...job,
      isSaved: !!actionsMap[job._id?.toString()]?.saved,
      isApplied: !!actionsMap[job._id?.toString()]?.applied,
    }));

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      jobs: result,
    });
  } catch (err) {
    next(err);
  }
});


// GET /api/jobs/:id — single job with score
router.get('/:id', optAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    const job = await JobCache.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const { score: matchScore, matched: matchedSkills, missing: missingSkills } =
      matchDetails(req.user?.skills || [], job);

    let isSaved = false;
    let isApplied = false;
    if (req.user) {
      const apps = await Application.find({
        user_id: req.user._id,
        job_id: job._id,
      }).lean();
      apps.forEach(a => {
        if (a.action === 'saved') isSaved = true;
        if (a.action === 'applied') isApplied = true;
      });
    }

    res.json({ success: true, job: { ...job, matchScore, matchedSkills, missingSkills, isSaved, isApplied } });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/:id/apply — record apply click
router.post('/:id/apply', authenticate, async (req, res, next) => {
  try {
    const job = await JobCache.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    await Application.findOneAndUpdate(
      { user_id: req.user._id, job_id: job._id, action: 'applied' },
      {
        $set: {
          job_snapshot: {
            title: job.title,
            company: job.company,
            location: job.location,
            type: job.type,
            apply_url: job.apply_url,
          },
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, apply_url: job.apply_url });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/:id/save — toggle save
router.post('/:id/save', authenticate, async (req, res, next) => {
  try {
    const job = await JobCache.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const existing = await Application.findOne({
      user_id: req.user._id,
      job_id: job._id,
      action: 'saved',
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, saved: false });
    }

    await Application.create({
      user_id: req.user._id,
      job_id: job._id,
      action: 'saved',
      job_snapshot: {
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        apply_url: job.apply_url,
      },
    });
    res.json({ success: true, saved: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/upload-csv — upload CSV with jobs
router.post('/upload-csv', authenticate, csvUpload.single('csv'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }

    const results = [];
    const errors = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          // Expected columns: title, company, description, location, salary, job_type, apply_url, tags, type, is_remote
          if (!row.title || !row.apply_url) {
            errors.push(`Skipped row missing title or apply_url`);
            return;
          }
          results.push({
            external_id: `csv_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            source: 'csv',
            type: (['job', 'internship', 'scholarship'].includes(row.type) ? row.type : 'job'),
            title: (row.title || '').trim(),
            company: (row.company || 'Unknown').trim(),
            description: (row.description || '').trim().slice(0, 2000),
            tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            location: (row.location || 'Not specified').trim(),
            salary: (row.salary || '').trim(),
            job_type: (row.job_type || 'full_time').trim(),
            apply_url: (row.apply_url || '').trim(),
            is_remote: row.is_remote === 'true' || row.is_remote === '1',
            posted_at: new Date(),
            expires_at: new Date('2099-12-31'), // CSV jobs don't expire
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows found in CSV', errors });
    }

    const ops = results.map(j => ({
      insertOne: { document: j },
    }));
    await JobCache.bulkWrite(ops);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Imported ${results.length} jobs from CSV`,
      count: results.length,
      errors,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
