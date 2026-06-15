const mongoose = require('mongoose');

const jobSnapshotSchema = new mongoose.Schema({
  title:     { type: String, default: '' },
  company:   { type: String, default: '' },
  location:  { type: String, default: '' },
  type:      { type: String, default: 'job' },
  apply_url: { type: String, default: '' },
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
  job_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'JobCache', required: true },
  action:       { type: String, enum: ['applied', 'saved'], default: 'applied' },
  job_snapshot: { type: jobSnapshotSchema, default: () => ({}) },
}, { timestamps: true });

applicationSchema.index({ user_id: 1, job_id: 1, action: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
