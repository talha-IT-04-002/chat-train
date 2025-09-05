const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');

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

module.exports = router;