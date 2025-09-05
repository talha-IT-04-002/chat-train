const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Test email configuration
router.post('/email', async (req, res) => {
  try {
    const { to = 'test@example.com' } = req.body;
    
    // Test connection first
    const connectionTest = await emailService.testConnection();
    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        error: 'Email service connection failed',
        details: connectionTest.error
      });
    }

    // Send a test email
    const testResult = await emailService.sendVerificationEmail(
      to,
      'test-token-123',
      'Test User'
    );

    if (testResult.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: testResult.messageId,
        to: to
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        details: testResult.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Test team invite email specifically
router.post('/email/team-invite', async (req, res) => {
  try {
    const { to = 'test@example.com' } = req.body;
    
    // Test connection first
    const connectionTest = await emailService.testConnection();
    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        error: 'Email service connection failed',
        details: connectionTest.error
      });
    }

    const testResult = await emailService.sendTeamInviteEmail({
      toEmail: to,
      inviteUrl: `${process.env.FRONTEND_URL}/accept-invite?token=test-invite-token-123`,
      organizationName: 'Test Organization',
      inviterName: 'Test Inviter',
      role: 'viewer'
    });

    if (testResult.success) {
      res.json({
        success: true,
        message: 'Team invite test email sent successfully',
        messageId: testResult.messageId,
        to: to
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send team invite test email',
        details: testResult.error
      });
    }
  } catch (error) {
    console.error('Team invite test email error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get email configuration status (without exposing sensitive data)
router.get('/email/config', (req, res) => {
  const config = {
    host: process.env.EMAIL_HOST || 'Not set',
    port: process.env.EMAIL_PORT || 'Not set',
    user: process.env.EMAIL_USER ? 'Set' : 'Not set',
    pass: process.env.EMAIL_PASS ? 'Set' : 'Not set',
    frontendUrl: process.env.FRONTEND_URL || 'Not set',
    nodeEnv: process.env.NODE_ENV || 'development'
  };

  res.json({
    success: true,
    config,
    missing: Object.entries(config)
      .filter(([key, value]) => value === 'Not set')
      .map(([key]) => key)
  });
});

module.exports = router;
