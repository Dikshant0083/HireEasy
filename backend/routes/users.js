const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticate = require('../middleware/authenticate');
const User = require('../models/User');
const { parseResume } = require('../services/resumeParser');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.pdf', '.docx', '.txt'].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : Object.assign(new Error('Upload a PDF, DOCX or TXT file'), { statusCode: 400 }), ok);
  },
});

// GET /api/user/profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) { next(err); }
});

// PATCH /api/user/profile — update name, phone, course, degree, cgpa, skills
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, phone, course, degree, cgpa, skills } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (course !== undefined) updates.course = course;
    if (degree !== undefined) updates.degree = degree;
    if (cgpa !== undefined && cgpa !== '' && cgpa !== null) {
      const n = Number(cgpa);
      if (!Number.isFinite(n) || n < 0 || n > 10) {
        return res.status(400).json({ success: false, message: 'CGPA must be a number between 0 and 10.' });
      }
      updates.cgpa = n;
    }
    if (skills && Array.isArray(skills)) updates.skills = skills;
    updates.profile_complete = !!(updates.name || req.user.name) && !!(updates.course || updates.degree || req.user.course || req.user.degree);

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// POST /api/user/resume — re-upload and re-parse resume
router.post('/resume', authenticate, upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const skills = await parseResume(req.file.path, req.file.mimetype);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          resume_path: req.file.path,
          resume_original_name: req.file.originalname,
          skills,
        }
      },
      { new: true }
    );
    res.json({ success: true, user, extractedSkills: skills });
  } catch (err) { next(err); }
});

module.exports = router;
