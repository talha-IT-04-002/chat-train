const express = require('express');
const { protect } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');

const Analytics = require('../models/Analytics');

const router = express.Router();

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const { organizationId, startDate, endDate } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: 'Organization ID is required'
    });
  }

  const query = { organizationId };
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const analytics = await Analytics.find(query)
    .populate('trainerId', 'name type')
    .sort('-date');

  res.json({
    success: true,
    count: analytics.length,
    data: analytics
  });
}));

module.exports = router;