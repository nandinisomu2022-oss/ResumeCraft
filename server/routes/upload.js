const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Portfolio = require('../models/Portfolio');
const { protect } = require('../middleware/auth');
const { parseResume } = require('../utils/resumeParser');

// Multer config for resumes
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/resumes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `resume_${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `profile_${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const resumeFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only PDF and DOCX files allowed'), false);
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files allowed'), false);
};

const uploadResume = multer({ storage: resumeStorage, fileFilter: resumeFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadProfile = multer({ storage: profileStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// @route   POST /api/upload/resume
// @desc    Upload and parse resume
router.post('/resume', protect, uploadResume.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const filePath = req.file.path;
    const parsed = await parseResume(filePath);

    res.json({
      success: true,
      message: 'Resume parsed successfully',
      data: parsed,
      filePath: `/uploads/resumes/${req.file.filename}`,
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to parse resume' });
  }
});

// @route   POST /api/upload/profile
// @desc    Upload profile image
router.post('/profile', protect, uploadProfile.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    res.json({
      success: true,
      message: 'Profile image uploaded',
      imageUrl: `/uploads/profiles/${req.file.filename}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
