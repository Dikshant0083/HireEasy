/**
 * Daily digest cron job — runs every day at 9:00 AM IST
 * Sends job alert emails + WhatsApp messages to subscribed users
 */
const cron = require('node-cron');
const User = require('../models/User');
const JobCache = require('../models/JobCache');
const { sendJobAlertEmail, sendWhatsAppAlert, sendInterviewReminder } = require('./alertService');

// TF-IDF match scorer (reuse from jobs route)
function scoreJob(userSkills, job) {
  if (!userSkills?.length) return 0;
  const text = [job.title, job.company, ...(job.tags || []), job.description || '']
    .join(' ').toLowerCase();
  const matches = userSkills.filter((s) => text.includes(s.toLowerCase()));
  return Math.round((matches.length / userSkills.length) * 100);
}

// ── Daily job digest — 9 AM IST (3:30 AM UTC) ────────────────────────────────
cron.schedule('30 3 * * *', async () => {
  console.log('🕘 Running daily job alert digest...');
  try {
    // Get all users who have alerts enabled
    const users = await User.find({
      'alert_preferences.email_alerts': true,
      skills: { $exists: true, $not: { $size: 0 } },
    });

    for (const user of users) {
      try {
        // Get top 10 most recent jobs, score them
        const recentJobs = await JobCache.find({
          expires_at: { $gt: new Date() },
        }).sort({ posted_at: -1 }).limit(200).lean();

        const scored = recentJobs
          .map((j) => ({ ...j, matchScore: scoreJob(user.skills, j) }))
          .filter((j) => j.matchScore >= 40) // Only good matches
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 8);

        if (!scored.length) continue;

        // Email alert
        await sendJobAlertEmail(user, scored);

        // WhatsApp alert (if enabled & phone exists)
        if (user.alert_preferences?.whatsapp_alerts && user.contact) {
          await sendWhatsAppAlert(user, scored.slice(0, 5));
        }
      } catch (err) {
        console.error(`⚠️ Alert failed for ${user.email}:`, err.message);
      }
    }
    console.log(`✅ Daily digest sent to ${users.length} users`);
  } catch (err) {
    console.error('❌ Daily digest cron failed:', err.message);
  }
}, { timezone: 'Asia/Kolkata' });

// ── Interview reminder — every 15 minutes, check for upcoming interviews ──────
cron.schedule('*/15 * * * *', async () => {
  try {
    const Interview = require('../models/Interview');
    const User = require('../models/User');
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 75 * 60 * 1000);

    // Find interviews scheduled in next 60-75 minutes that haven't been reminded
    const upcoming = await Interview.find({
      scheduled_at: { $gte: oneHourLater, $lte: twoHoursLater },
      reminder_sent: false,
    });

    for (const interview of upcoming) {
      const user = await User.findById(interview.user_id);
      if (user) {
        await sendInterviewReminder(user, interview);
        await Interview.updateOne({ _id: interview._id }, { reminder_sent: true });
      }
    }
  } catch (err) {
    // Interview model might not exist yet — ignore
  }
});

console.log('⏰ Cron jobs scheduled: Daily digest @ 9AM IST, Interview reminders every 15min');

module.exports = {};
