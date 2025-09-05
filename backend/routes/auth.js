const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/User');
const Organization = require('../models/Organization');
const TeamMember = require('../models/TeamMember');
const { protect } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

router.post('/register', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('organizationName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Organization name must be less than 100 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email, password, firstName, lastName, organizationName } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  let organization = null;
  if (organizationName) {
    organization = await Organization.create({
      name: organizationName,
      description: `Organization for ${firstName} ${lastName}`,
      subscription: {
        plan: 'free',
        status: 'trial'
      }
    });
  }

  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    status: 'pending',
    emailVerified: false
  });

  if (organization) {
    await TeamMember.create({
      organizationId: organization._id,
      userId: user._id,
      role: 'owner',
      status: 'active',
      joinedAt: new Date()
    });
  }

  const verificationToken = user.getEmailVerificationToken();
  await user.save();

  try {
    await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }

  const token = user.getSignedJwtToken();

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for verification.',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified
      },
      organization: organization ? {
        id: organization._id,
        name: organization.name
      } : null,
      token
    }
  });
}));

router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  if (user.status !== 'active') {
    return res.status(401).json({
      success: false,
      message: 'Account is not active. Please verify your email or contact support.'
    });
  }

  user.lastLogin = new Date();
  await user.save();

  const teamMemberships = await TeamMember.find({ userId: user._id })
    .populate('organizationId', 'name logo domain')
    .populate('organizationId');

  const token = user.getSignedJwtToken();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        preferences: user.preferences
      },
      organizations: teamMemberships.map(tm => ({
        id: tm.organizationId._id,
        name: tm.organizationId.name,
        logo: tm.organizationId.logo,
        domain: tm.organizationId.domain,
        role: tm.role,
        permissions: tm.permissions
      })),
      token
    }
  });
}));

router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  const teamMemberships = await TeamMember.find({ userId: user._id })
    .populate('organizationId', 'name logo domain subscription');

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        preferences: user.preferences,
        profile: user.profile
      },
      organizations: teamMemberships.map(tm => ({
        id: tm.organizationId._id,
        name: tm.organizationId.name,
        logo: tm.organizationId.logo,
        domain: tm.organizationId.domain,
        role: tm.role,
        permissions: tm.permissions,
        subscription: tm.organizationId.subscription
      }))
    }
  });
}));

router.post('/verify-email', [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { token } = req.body;

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification token'
    });
  }

  user.emailVerified = true;
  user.status = 'active';
  user.emailVerificationToken = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
}));

router.post('/resend-verification', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.emailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  const verificationToken = user.getEmailVerificationToken();
  await user.save();

  try {
    await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName);
    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
}));

router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save();
  try {
    await emailService.sendPasswordResetEmail(user.email, resetToken, user.firstName);
    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email'
    });
  }
}));

router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { token, password } = req.body;

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

router.put('/preferences', protect, [
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark'),
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean'),
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be 2-5 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { theme, notifications, language } = req.body;

  const user = await User.findById(req.user.id);
  
  if (theme !== undefined) user.preferences.theme = theme;
  if (notifications !== undefined) user.preferences.notifications = notifications;
  if (language !== undefined) user.preferences.language = language;

  await user.save();

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      preferences: user.preferences
    }
  });
}));

router.post('/logout', protect, asyncHandler(async (req, res) => {
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

module.exports = router;