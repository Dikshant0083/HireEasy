const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');
const { sendJobAlertEmail, sendWhatsAppAlert } = require('../services/alertService');
const JobCache = require('../models/JobCache');
const { scoreJob } = require('../services/scorer');

const topMatches = (user, jobs, n) => jobs
  .map((j) => ({ ...j, matchScore: scoreJob(user.skills || [], j) }))
  .filter((j) => j.matchScore !== null)
  .sort((a, b) => b.matchScore - a.matchScore)
  .slice(0, n);


// GET /api/alerts/preferences — get alert settings
router.get('/preferences', authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      preferences: req.user.alert_preferences || { email_alerts: false, whatsapp_alerts: false },
    });
  } catch (err) { next(err); }
});

// PATCH /api/alerts/preferences — update alert settings
router.patch('/preferences', authenticate, async (req, res, next) => {
  try {
    const { email_alerts, whatsapp_alerts } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'alert_preferences.email_alerts': !!email_alerts, 'alert_preferences.whatsapp_alerts': !!whatsapp_alerts } },
      { new: true }
    );
    res.json({ success: true, preferences: user.alert_preferences });
  } catch (err) { next(err); }
});

// POST /api/alerts/test-email — send a test email alert
router.post('/test-email', authenticate, async (req, res, next) => {
  try {
    const jobs = await JobCache.find({ expires_at: { $gt: new Date() } })
      .sort({ posted_at: -1 }).limit(100).lean();
    const scored = topMatches(req.user, jobs, 5);
    if (!scored.length) {
      return res.status(400).json({ success: false, message: 'No matching jobs yet. Upload a resume so we know your skills.' });
    }
    await sendJobAlertEmail(req.user, scored);
    res.json({ success: true, message: `Test email sent to ${req.user.email}` });
  } catch (err) {
    console.error('Test email failed:', err.message);
    res.status(502).json({ success: false, message: 'Could not send the email. Check the mail settings on the server.' });
  }
});

// POST /api/alerts/test-whatsapp — send a test WhatsApp message
router.post('/test-whatsapp', authenticate, async (req, res, next) => {
  try {
    if (!process.env.CALLMEBOT_API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'CALLMEBOT_API_KEY not set. Activate at callmebot.com and add the key to .env',
      });
    }
    if (!(req.user.phone || req.user.contact)) {
      return res.status(400).json({ success: false, message: 'No phone number in your profile. Please update your contact number first.' });
    }
    const jobs = await JobCache.find({ expires_at: { $gt: new Date() } })
      .sort({ posted_at: -1 }).limit(50).lean();
    const scored = topMatches(req.user, jobs, 3);
    await sendWhatsAppAlert(req.user, scored);
    res.json({ success: true, message: `WhatsApp sent to ${req.user.phone || req.user.contact}` });
  } catch (err) { next(err); }
});

module.exports = router;
