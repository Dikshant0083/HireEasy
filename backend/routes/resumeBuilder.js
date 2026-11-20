const express = require('express');
const router = express.Router();
const ResumeData = require('../models/ResumeData');
const authenticate = require('../middleware/authenticate');

// GET /api/resume-builder — get user's resume data
router.get('/', authenticate, async (req, res, next) => {
  try {
    let resume = await ResumeData.findOne({ user_id: req.user._id }).lean();
    if (!resume) {
      // Auto-fill from user profile
      resume = {
        template: 'modern',
        personal: {
          name:  req.user.name || '',
          email: req.user.email || '',
          phone: req.user.phone || req.user.contact || '',
        },
        // Profile stores course = "B.Tech" and degree = branch ("CSE").
        education: (req.user.course || req.user.degree) ? [{
          degree: req.user.course || '',
          field:  req.user.degree || '',
          cgpa:   req.user.cgpa ? String(req.user.cgpa) : '',
        }] : [],
        skills: { technical: req.user.skills || [], soft: [], languages: [], tools: [] },
        experience: [], projects: [], certifications: [],
      };
    }
    res.json({ success: true, resume });
  } catch (err) { next(err); }
});

// PUT /api/resume-builder — save/update resume data
router.put('/', authenticate, async (req, res, next) => {
  try {
    const { _id, user_id, createdAt, updatedAt, __v, ...data } = req.body || {};
    const resume = await ResumeData.findOneAndUpdate(
      { user_id: req.user._id },
      { $set: { ...data, user_id: req.user._id } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, resume });
  } catch (err) { next(err); }
});

// PATCH /api/resume-builder/template — switch template
router.patch('/template', authenticate, async (req, res, next) => {
  try {
    const { template } = req.body;
    await ResumeData.findOneAndUpdate(
      { user_id: req.user._id },
      { $set: { template } },
      { upsert: true, runValidators: true }
    );
    res.json({ success: true, template });
  } catch (err) { next(err); }
});

module.exports = router;
