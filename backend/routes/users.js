const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const { single: uploadSingle, handleUploadError } = require('../middleware/upload');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');

  res.json({
    success: true,
    count: users.length,
    data: users
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this user'
    });
  }

  res.json({
    success: true,
    data: user
  });
}));

// Get current authenticated user (safe fields)
router.get('/me/profile', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, data: user });
}));

// Update profile (name, profile fields, preferences subset not handled here)
router.put('/me/profile', asyncHandler(async (req, res) => {
  const { firstName, lastName, profile } = req.body || {};

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (typeof firstName === 'string') user.firstName = firstName;
  if (typeof lastName === 'string') user.lastName = lastName;

  if (profile && typeof profile === 'object') {
    user.profile = {
      ...user.profile?.toObject?.() || user.profile || {},
      ...profile,
    };
  }

  await user.save();
  const safe = await User.findById(user._id).select('-password');
  res.json({ success: true, message: 'Profile updated', data: safe });
}));

// Change password (requires currentPassword and newPassword)
router.put('/me/password', asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
}));

// Upload avatar (multipart form-data field: avatar)
router.post('/me/avatar', (req, res, next) => uploadSingle('avatar')(req, res, (err) => handleUploadError(err, req, res, next)), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.avatar = `/uploads/training-materials/${req.file.filename}`;
  await user.save();

  res.json({
    success: true,
    message: 'Avatar updated successfully',
    data: { avatar: user.avatar }
  });
}));

module.exports = router;