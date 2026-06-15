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
const { scoreJob } = require('../services/scorer');

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
    else cb(new Error('Only CSV files allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// GET /api/jobs — list all jobs with optional filters
router.get('/', optAuth, async (req, res, next) => {
  try {
    // Refresh real-time data if stale (non-blocking on subsequent requests)
    refreshJobsIfStale().catch(console.error);

    const {
      type, search, remote, page = 1, limit = 20,
      source, sortBy = 'date',
    } = req.query;

    const filter = {};
    if (type && ['job', 'internship', 'scholarship'].includes(type)) filter.type = type;
    if (remote === 'true') filter.is_remote = true;
    if (source && ['remotive', 'arbeitnow', 'scholarship', 'csv', 'themuse', 'jsearch', 'jooble'].includes(source)) {
      filter.source = source;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const userSkills = req.user ? (req.user.skills || []) : [];
    const scoreSort = sortBy === 'score' && userSkills.length > 0;

    let jobs, total;

    if (scoreSort) {
      // Fetch all (reasonable cap) and sort by match score in memory
      const allJobs = await JobCache.find(filter).sort({ posted_at: -1 }).limit(500).lean();
      const scored = allJobs.map(job => ({
        ...job,
        matchScore: scoreJob(userSkills, job),
      })).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

      total = scored.length;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      jobs = scored.slice(skip, skip + parseInt(limit));
    } else {
      total = await JobCache.countDocuments(filter);
      const skip = (parseInt(page) - 1) * parseInt(limit);
      jobs = await JobCache.find(filter)
        .sort({ posted_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
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
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      jobs: result,
    });
  } catch (err) {
    next(err);
  }
});


// GET /api/jobs/:id — single job with score
router.get('/:id', optAuth, async (req, res, next) => {
  try {
    const job = await JobCache.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const userSkills = req.user ? req.user.skills : [];
    const matchScore = userSkills.length > 0 ? scoreJob(userSkills, job) : null;

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

    res.json({ success: true, job: { ...job, matchScore, isSaved, isApplied } });
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
