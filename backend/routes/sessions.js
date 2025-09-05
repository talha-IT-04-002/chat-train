const express = require('express');
const { protect } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');

const Session = require('../models/Session');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get user sessions
// @route   GET /api/sessions
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { trainerId, organizationId } = req.query;
  
  const query = { userId: req.user.id };
  if (trainerId) query.trainerId = trainerId;
  if (organizationId) query.organizationId = organizationId;

  const sessions = await Session.find(query)
    .populate('trainerId', 'name type')
    .sort('-createdAt');

  res.json({
    success: true,
    count: sessions.length,
    data: sessions
  });
}));

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const session = await Session.findOne({
    _id: req.params.id,
    userId: req.user.id
  }).populate('trainerId', 'name type');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  res.json({
    success: true,
    data: session
  });
}));

module.exports = router;
