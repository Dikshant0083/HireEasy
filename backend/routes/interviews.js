const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const authenticate = require('../middleware/authenticate');

// GET /api/interviews — list user's interviews
router.get('/', authenticate, async (req, res, next) => {
  try {
    const interviews = await Interview.find({ user_id: req.user._id })
      .sort({ scheduled_at: 1 }).lean();
    res.json({ success: true, interviews });
  } catch (err) { next(err); }
});

// POST /api/interviews — schedule new interview
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { company, role, scheduled_at, format, link, notes, job_id } = req.body;
    if (!company || !role || !scheduled_at) {
      return res.status(400).json({ success: false, message: 'company, role, and scheduled_at are required' });
    }
    const interview = await Interview.create({
      user_id: req.user._id,
      company, role, scheduled_at, format, link, notes,
      job_id: job_id || null,
    });
    res.status(201).json({ success: true, interview });
  } catch (err) { next(err); }
});

// PATCH /api/interviews/:id — update interview
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, interview });
  } catch (err) { next(err); }
});

// DELETE /api/interviews/:id — cancel interview
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await Interview.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
