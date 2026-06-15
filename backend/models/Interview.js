const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company:      { type: String, required: true },
  role:         { type: String, required: true },
  scheduled_at: { type: Date, required: true },
  format:       { type: String, enum: ['Online', 'Onsite', 'Phone', 'Assessment'], default: 'Online' },
  link:         { type: String, default: '' },
  notes:        { type: String, default: '' },
  status:       { type: String, enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
  reminder_sent:{ type: Boolean, default: false },
  job_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'JobCache', default: null },
}, { timestamps: true });

interviewSchema.index({ user_id: 1, scheduled_at: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
