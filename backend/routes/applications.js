const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const Application = require('../models/Application');

// GET /api/applications — user's saved + applied jobs
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { action } = req.query; // ?action=applied|saved
    const filter = { user_id: req.user._id };
    if (action && ['applied', 'saved'].includes(action)) filter.action = action;

    const applications = await Application.find(filter)
      .populate({
        path: 'job_id',
        select: 'title company location type is_remote apply_url tags source posted_at',
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, applications });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/applications/:id — remove saved job
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await Application.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id,
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
