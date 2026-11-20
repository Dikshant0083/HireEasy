const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { parseResume } = require('../services/resumeParser');
const { sendWelcomeEmail } = require('../services/emailService');
const { verifyFirebaseToken } = require('../middleware/authenticate');

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
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(Object.assign(new Error('Upload your resume as a PDF, DOCX or TXT file'), { statusCode: 400 }));
  },
});

/**
 * POST /api/auth/sync
 * Called after Firebase login/register to create/sync MongoDB user profile.
 * Handles:
 *  1. Existing user by firebase_uid → update
 *  2. Old user by email (no firebase_uid) → migrate: add firebase_uid + update
 *  3. Brand new user → create + send welcome email
 */
router.post('/sync', upload.single('resume'), async (req, res, next) => {
  try {
    const { idToken, name, phone, course, degree, cgpa, provider } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'idToken required' });
    if (cgpa !== undefined && cgpa !== '' && !(Number(cgpa) >= 0 && Number(cgpa) <= 10)) {
      return res.status(400).json({ success: false, message: 'CGPA must be a number between 0 and 10.' });
    }

    // 1. Verify Firebase token
    let firebaseUser;
    try {
      firebaseUser = await verifyFirebaseToken(idToken);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid Firebase token' });
    }

    const { localId: firebase_uid, email, displayName } = firebaseUser;
    req.firebaseUid = firebase_uid;
    const resolvedName = name || displayName || email?.split('@')[0] || 'User';

    // 2. Parse resume if uploaded
    let skills = [];
    let resume_path = null;
    let resume_original_name = null;

    if (req.file) {
      resume_path = req.file.path;
      resume_original_name = req.file.originalname;
      try {
        skills = await parseResume(req.file.path, req.file.mimetype);
      } catch (e) {
        console.error('Resume parse error:', e.message);
      }
    }

    // 3. Find existing user — first by firebase_uid, then by email (migration)
    let user = await User.findOne({ firebase_uid });
    let isNewUser = false;

    if (user) {
      // Existing user — update profile
      const updateData = {
        name: name || user.name,
        phone: phone || user.phone || '',
        course: course || user.course || '',
        degree: degree || user.degree || '',
        cgpa: cgpa !== undefined && cgpa !== '' ? parseFloat(cgpa) : user.cgpa,
        provider: provider || user.provider || 'email',
      };
      if (req.file) {
        updateData.resume_path = resume_path;
        updateData.resume_original_name = resume_original_name;
        updateData.skills = skills;
      }
      updateData.profile_complete = !!(updateData.name && (updateData.course || updateData.degree));

      user = await User.findOneAndUpdate(
        { firebase_uid },
        { $set: updateData },
        { new: true, runValidators: false }
      );

    } else {
      // Try to find by email (old record without firebase_uid — migrate it)
      const existingByEmail = await User.findOne({ email });

      if (existingByEmail) {
        // Migrate: attach firebase_uid to old record
        console.log(`🔄 Migrating existing user ${email} → firebase_uid ${firebase_uid}`);
        const updateData = {
          firebase_uid,
          name: name || existingByEmail.name || resolvedName,
          phone: phone || existingByEmail.phone || '',
          course: course || existingByEmail.course || '',
          degree: degree || existingByEmail.degree || '',
          cgpa: cgpa !== undefined && cgpa !== '' ? parseFloat(cgpa) : existingByEmail.cgpa,
          provider: provider || 'email',
        };
        if (req.file) {
          updateData.resume_path = resume_path;
          updateData.resume_original_name = resume_original_name;
          updateData.skills = skills;
        }
        updateData.profile_complete = !!(updateData.name && (updateData.course || updateData.degree));

        user = await User.findOneAndUpdate(
          { email },
          { $set: updateData },
          { new: true, runValidators: false }
        );

      } else {
        // Brand new user — create
        isNewUser = true;
        user = await User.create({
          firebase_uid,
          email: email || '',
          name: resolvedName,
          phone: phone || '',
          course: course || '',
          degree: degree || '',
          cgpa: cgpa !== undefined && cgpa !== '' ? parseFloat(cgpa) : null,
          provider: provider || 'email',
          skills: skills.length > 0 ? skills : [],
          resume_path,
          resume_original_name,
          profile_complete: !!(resolvedName && (course || degree)),
        });
        // Send welcome email async (don't block response)
        sendWelcomeEmail({ name: user.name, email: user.email });
      }
    }

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      isNewUser,
      user: user.toPublic(),
      extractedSkills: req.file ? skills : undefined,
    });
  } catch (err) {
    // Two sync calls for the same new account can race (e.g. login page and app loader).
    // The loser hits the unique index; return the profile the winner just created.
    if (err.code === 11000) {
      const existing = req.firebaseUid && await User.findOne({ firebase_uid: req.firebaseUid });
      if (existing) return res.json({ success: true, isNewUser: false, user: existing.toPublic() });
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please sign in.',
      });
    }
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Returns current MongoDB user profile using Firebase token
 */
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token' });
    }
    const idToken = authHeader.split(' ')[1];
    let firebaseUser;
    try {
      firebaseUser = await verifyFirebaseToken(idToken);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Look up by firebase_uid first, then by email (for migrated accounts)
    let user = await User.findOne({ firebase_uid: firebaseUser.localId });
    if (!user && firebaseUser.email) {
      user = await User.findOne({ email: firebaseUser.email });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    // If found by email but missing firebase_uid, patch it silently
    if (!user.firebase_uid) {
      await User.updateOne({ _id: user._id }, { $set: { firebase_uid: firebaseUser.localId } });
      user.firebase_uid = firebaseUser.localId;
    }

    res.json({ success: true, user: user.toPublic() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
