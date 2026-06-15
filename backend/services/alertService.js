/**
 * Alert Service — Email (Nodemailer) + WhatsApp (CallMeBot — FREE)
 * CallMeBot: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 * Activation: Send "I allow callmebot to send me messages" to +34 644 44 74 88 on WhatsApp
 */
const nodemailer = require('nodemailer');
const https = require('https');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ── CallMeBot WhatsApp ────────────────────────────────────────────────────────
function sendCallMeBotWhatsApp(phone, message) {
  return new Promise((resolve, reject) => {
    // Normalize phone to international format (remove spaces/dashes, ensure + prefix)
    let p = String(phone).replace(/\D/g, '');
    if (!p.startsWith('91') && p.length === 10) p = '91' + p;
    if (!p.startsWith('+')) p = '+' + p;

    const apiKey = process.env.CALLMEBOT_API_KEY;
    if (!apiKey) return reject(new Error('CALLMEBOT_API_KEY not set in .env'));

    const text = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(p)}&text=${text}&apikey=${apiKey}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`📱 WhatsApp sent to ${p} via CallMeBot`);
          resolve(data);
        } else {
          reject(new Error(`CallMeBot: HTTP ${res.statusCode} — ${data}`));
        }
      });
    }).on('error', reject);
  });
}

// ── Email alert ───────────────────────────────────────────────────────────────
async function sendJobAlertEmail(user, jobs) {
  if (!jobs.length) return;

  const jobRows = jobs.map((job) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #1e1e2e;">
        <div style="font-weight:600;color:#c084fc;">${job.title}</div>
        <div style="color:#a1a1aa;font-size:13px;">${job.company} · ${job.location}</div>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #1e1e2e;text-align:center;">
        <span style="background:${job.matchScore >= 70 ? '#16a34a' : job.matchScore >= 40 ? '#d97706' : '#dc2626'};
          color:#fff;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;">
          ${Math.round(job.matchScore || 0)}% Match
        </span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #1e1e2e;text-align:center;">
        <a href="${job.apply_url}" style="background:#7c3aed;color:#fff;padding:6px 16px;
          border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">
          Apply →
        </a>
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#c084fc;font-size:28px;margin:0;">🎯 HireEasy</h1>
          <p style="color:#a1a1aa;margin-top:8px;">Your daily job matches are ready</p>
        </div>

        <div style="background:#111118;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
          <div style="padding:20px 24px;border-bottom:1px solid #1e1e2e;">
            <h2 style="color:#fff;margin:0;font-size:18px;">
              👋 Hi ${user.name}, here are your top matches today
            </h2>
            <p style="color:#a1a1aa;margin:8px 0 0;font-size:14px;">
              Based on your skills: <strong style="color:#c084fc;">
                ${(user.skills || []).slice(0, 5).join(', ')}
              </strong>
            </p>
          </div>

          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#0d0d18;">
                <th style="padding:10px 16px;color:#6b7280;font-size:12px;font-weight:600;text-align:left;">JOB</th>
                <th style="padding:10px 16px;color:#6b7280;font-size:12px;font-weight:600;text-align:center;">MATCH</th>
                <th style="padding:10px 16px;color:#6b7280;font-size:12px;font-weight:600;text-align:center;">ACTION</th>
              </tr>
            </thead>
            <tbody>${jobRows}</tbody>
          </table>

          <div style="padding:20px 24px;text-align:center;">
            <a href="http://localhost:3000/jobs" style="background:linear-gradient(135deg,#7c3aed,#db2777);
              color:#fff;padding:12px 32px;border-radius:12px;text-decoration:none;
              font-weight:700;font-size:15px;display:inline-block;">
              Browse All Jobs →
            </a>
          </div>
        </div>

        <p style="color:#374151;font-size:12px;text-align:center;margin-top:24px;">
          You're receiving this because you have job alerts enabled.
          <a href="http://localhost:3000/dashboard" style="color:#6b7280;">Manage preferences</a>
        </p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"HireEasy 🎯" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `🎯 ${jobs.length} new job matches for you today!`,
    html,
  });

  console.log(`📧 Job alert email sent to ${user.email}`);
}

// ── WhatsApp alert (CallMeBot — FREE) ────────────────────────────────────────
async function sendWhatsAppAlert(user, jobs) {
  if (!jobs.length || !user.contact || !process.env.CALLMEBOT_API_KEY) return;

  const jobLines = jobs.slice(0, 5).map((j, i) =>
    `${i + 1}. ${j.title} @ ${j.company} | ${Math.round(j.matchScore || 0)}% match`
  ).join('\n');

  const message = `HireEasy Job Alert 🎯\n\nHi ${user.name}! Top ${Math.min(jobs.length, 5)} matches:\n\n${jobLines}\n\nView all: http://localhost:3000/jobs`;

  await sendCallMeBotWhatsApp(user.contact, message);
}


// ── Interview reminder email ──────────────────────────────────────────────────
async function sendInterviewReminder(user, interview) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:32px;background:#0a0a0f;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:500px;margin:0 auto;background:#111118;border:1px solid #1e1e2e;
        border-radius:16px;padding:32px;">
        <h2 style="color:#c084fc;margin-top:0;">⏰ Interview Reminder</h2>
        <p style="color:#e5e7eb;">Your interview is in <strong style="color:#f59e0b;">1 hour</strong>!</p>
        <div style="background:#0d0d18;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="color:#a1a1aa;margin:0 0 8px;font-size:13px;">INTERVIEW DETAILS</p>
          <p style="color:#fff;margin:4px 0;font-size:16px;font-weight:700;">
            ${interview.company}
          </p>
          <p style="color:#c084fc;margin:4px 0;">${interview.role}</p>
          <p style="color:#a1a1aa;margin:4px 0;">📅 ${new Date(interview.scheduled_at).toLocaleString('en-IN')}</p>
          <p style="color:#a1a1aa;margin:4px 0;">📍 ${interview.format}</p>
          ${interview.link ? `<p style="margin:8px 0 0;"><a href="${interview.link}" style="color:#7c3aed;">🔗 Join Meeting</a></p>` : ''}
        </div>
        ${interview.notes ? `<p style="color:#6b7280;font-size:13px;">Notes: ${interview.notes}</p>` : ''}
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"HireEasy 🎯" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `⏰ Reminder: Interview at ${interview.company} in 1 hour`,
    html,
  });

  console.log(`⏰ Interview reminder sent to ${user.email}`);
}

module.exports = { sendJobAlertEmail, sendWhatsAppAlert, sendInterviewReminder };
