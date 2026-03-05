const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    ok: true,
    token,
    user: {
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      photo: user.photo,
    },
  });
};

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, message: errors.array()[0].msg });
  }
  const { name, email, password, phone } = req.body;
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ ok: false, message: 'An account with this email already exists.' });
    }
    const count = await User.countDocuments();
    const role = count === 0 ? 'admin' : 'user';
    const user = await User.create({ name, email, password, phone, role });
    sendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, message: errors.array()[0].msg });
  }
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ ok: false, message: 'No account found with this email.' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ ok: false, message: 'Incorrect password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ ok: false, message: 'Account deactivated. Contact support.' });
    }
    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.post('/google', async (req, res) => {
  const { name, email, googleId, photo } = req.body;
  if (!email || !googleId) {
    return res.status(400).json({ ok: false, message: 'Missing Google credentials.' });
  }
  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const count = await User.countDocuments();
      user = await User.create({
        name, email, googleId, photo,
        role: count === 0 ? 'admin' : 'user',
        password: undefined,
      });
    } else {
      if (!user.googleId) { user.googleId = googleId; await user.save(); }
    }
    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('favourites', 'name species photos');
  res.json({ ok: true, user });
});

router.put('/profile', protect, async (req, res) => {
  const { name, phone, photo } = req.body;
  const update = {};
  if (name)  update.name  = name;
  if (phone) update.phone = phone;
  if (photo) update.photo = photo;
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
  res.json({ ok: true, user });
});

module.exports = router;