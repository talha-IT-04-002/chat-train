const express = require('express');
const { protect } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get reports
// @route   GET /api/reports
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  // TODO: Implement reports functionality
  res.json({
    success: true,
    message: 'Reports endpoint - to be implemented',
    data: []
  });
}));

module.exports = router;
