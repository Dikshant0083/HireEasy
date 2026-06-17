const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function run() {
  try {
    await transporter.verify();
    console.log("SUCCESS: Gmail credentials work!");
  } catch (err) {
    console.error("FAILED:", err.message);
  }
}
run();
