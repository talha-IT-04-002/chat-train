const express = require('express');
const { protect } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');

const router = express.Router();

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Notifications endpoint - to be implemented',
    data: []
  });
}));

module.exports = router;
