const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendWelcomeEmail = async ({ name, email }) => {
  if (!process.env.EMAIL_PASSWORD) {
    console.log('⚠️  EMAIL_PASSWORD not set — skipping welcome email');
    return;
  }
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"HireEasy 🚀" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to HireEasy — Your Career Journey Begins!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background-color:#0a0a14;font-family:'Inter',Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:16px;padding:14px 24px;">
                <span style="color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">HireEasy</span>
              </div>
            </div>

            <!-- Main card -->
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(139,92,246,0.25);border-radius:20px;padding:40px;margin-bottom:24px;">
              <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px 0;">
                Welcome aboard, ${name}! 🎉
              </h1>
              <p style="color:#9ca3af;font-size:16px;margin:0 0 32px 0;line-height:1.6;">
                Your account has been successfully created. You're now part of <strong style="color:#a78bfa;">HireEasy</strong> — the smartest way to discover jobs, internships, and scholarships matched to <em>your</em> profile.
              </p>

              <!-- Feature highlights -->
              <div style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:24px;margin-bottom:28px;">
                <p style="color:#c4b5fd;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px 0;">What you can do now</p>
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0;color:#e5e7eb;font-size:14px;">🌐</td>
                    <td style="padding:8px 0;color:#e5e7eb;font-size:14px;"><strong style="color:#fff;">Browse live jobs</strong> from Remotive, Arbeitnow & more</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#e5e7eb;font-size:14px;">📄</td>
                    <td style="padding:8px 0;color:#e5e7eb;font-size:14px;"><strong style="color:#fff;">Upload your resume</strong> — we auto-detect your skills</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#e5e7eb;font-size:14px;">🧠</td>
                    <td style="padding:8px 0;color:#e5e7eb;font-size:14px;"><strong style="color:#fff;">Get match scores</strong> — see how well each job fits you</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#e5e7eb;font-size:14px;">🏅</td>
                    <td style="padding:8px 0;color:#e5e7eb;font-size:14px;"><strong style="color:#fff;">Explore scholarships</strong> — Fulbright, Gates Cambridge & more</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#e5e7eb;font-size:14px;">📊</td>
                    <td style="padding:8px 0;color:#e5e7eb;font-size:14px;"><strong style="color:#fff;">Track applications</strong> — all in one dashboard</td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;">
                <a href="http://localhost:3000/dashboard"
                   style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
                  🚀 Go to My Dashboard
                </a>
              </div>
            </div>

            <!-- Account info -->
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">Account Details</p>
              <p style="color:#d1d5db;font-size:14px;margin:4px 0;"><strong style="color:#9ca3af;">Name:</strong> ${name}</p>
              <p style="color:#d1d5db;font-size:14px;margin:4px 0;"><strong style="color:#9ca3af;">Email:</strong> ${email}</p>
              <p style="color:#d1d5db;font-size:14px;margin:4px 0;"><strong style="color:#9ca3af;">Registered:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <!-- Footer -->
            <div style="text-align:center;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="color:#4b5563;font-size:12px;margin:0 0 6px 0;">© 2024 HireEasy. All rights reserved.</p>
              <p style="color:#374151;font-size:11px;margin:0;">This is an automated message — please do not reply to this email.</p>
            </div>

          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Welcome email sent to: ${email}`);
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    // Don't throw — email failure shouldn't break registration
  }
};

module.exports = { sendWelcomeEmail };
