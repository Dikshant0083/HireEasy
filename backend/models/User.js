const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebase_uid: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  // Academic details
  course: { type: String, default: '' },    // e.g., "B.Tech", "M.Tech", "MBA", "BCA"
  degree: { type: String, default: '' },    // e.g., "CSE", "ECE", "Mechanical"
  cgpa: { type: Number, default: null, min: 0, max: 10 },
  // Contact
  contact: { type: String, default: '' },
  // Resume & skills
  skills: [{ type: String }],
  resume_path: { type: String, default: null },
  resume_original_name: { type: String, default: null },
  // Auth provider
  provider: { type: String, enum: ['email', 'google'], default: 'email' },
  profile_complete: { type: Boolean, default: false },
  // Alert preferences
  alert_preferences: {
    email_alerts:    { type: Boolean, default: false },
    whatsapp_alerts: { type: Boolean, default: false },
  },
}, { timestamps: true });

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  return obj;
};

module.exports = mongoose.model('User', userSchema);
