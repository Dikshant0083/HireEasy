const mongoose = require('mongoose');

const jobCacheSchema = new mongoose.Schema({
  external_id: { type: String, unique: true, sparse: true },
  source: {
    type: String,
    enum: ['remotive', 'arbeitnow', 'scholarship', 'csv'],
    required: true
  },
  type: {
    type: String,
    enum: ['job', 'internship', 'scholarship'],
    default: 'job'
  },
  title: { type: String, required: true },
  company: { type: String, default: 'Unknown' },
  company_logo: { type: String, default: null },
  description: { type: String, default: '' },
  tags: [{ type: String }],
  location: { type: String, default: 'Remote' },
  salary: { type: String, default: '' },
  job_type: { type: String, default: 'full_time' },
  apply_url: { type: String, required: true },
  is_remote: { type: Boolean, default: false },
  posted_at: { type: Date, default: Date.now },
  // TTL: jobs expire after 1h; scholarships/csv never expire (set very far future)
  expires_at: { type: Date, index: { expireAfterSeconds: 0 } },
}, { timestamps: true });

jobCacheSchema.index({ source: 1 });
jobCacheSchema.index({ type: 1 });
jobCacheSchema.index({ tags: 1 });
jobCacheSchema.index({ is_remote: 1 });

module.exports = mongoose.model('JobCache', jobCacheSchema);
