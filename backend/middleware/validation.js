const { validationResult } = require('express-validator');
module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details: errors.array().map(e => ({ field: e.path, message: e.msg }))
  });
};


