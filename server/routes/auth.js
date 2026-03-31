const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ success: false, message: 'Email already registered' });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({ name, email: email.toLowerCase(), password: hashedPassword });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: info?.message || 'Invalid credentials' });

    const token = generateToken(user._id);
    user.lastLogin = Date.now();
    user.save();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  })(req, res, next);
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login.html?error=oauth_failed` }),
  (req, res) => {
    const token = generateToken(req.user._id);
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/dashboard.html?token=${token}&name=${encodeURIComponent(req.user.name)}&avatar=${encodeURIComponent(req.user.avatar || '')}`);
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', require('../middleware/auth').protect, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update profile
router.put('/profile', require('../middleware/auth').protect, async (req, res) => {
  try {
    const { name, githubUsername, linkedinUrl } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, githubUsername, linkedinUrl },
      { new: true, select: '-password' }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
