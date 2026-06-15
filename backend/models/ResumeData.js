const mongoose = require('mongoose');

const resumeDataSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  template: { type: String, enum: ['modern', 'classic', 'minimal'], default: 'modern' },
  personal: {
    name:     { type: String, default: '' },
    email:    { type: String, default: '' },
    phone:    { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github:   { type: String, default: '' },
    website:  { type: String, default: '' },
    summary:  { type: String, default: '' },
  },
  education: [{
    institution: String,
    degree:      String,
    field:       String,
    start_year:  String,
    end_year:    String,
    cgpa:        String,
  }],
  experience: [{
    company:     String,
    role:        String,
    location:    String,
    start_date:  String,
    end_date:    String,
    current:     { type: Boolean, default: false },
    description: String,
  }],
  projects: [{
    name:        String,
    description: String,
    tech_stack:  [String],
    link:        String,
  }],
  skills: {
    technical: [String],
    soft:      [String],
    languages: [String],
    tools:     [String],
  },
  certifications: [{
    name:   String,
    issuer: String,
    year:   String,
    link:   String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('ResumeData', resumeDataSchema);
