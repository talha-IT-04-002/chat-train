const express = require('express');
const { protect } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');
const asyncHandler = require('express-async-handler');

const Organization = require('../models/Organization');
const TeamMember = require('../models/TeamMember');

const router = express.Router();

router.post(
  '/:id/team/accept',
  [
    body('token').notEmpty().withMessage('Invite token is required'),
    body('firstName').optional().isLength({ min: 1, max: 50 }),
    body('lastName').optional().isLength({ min: 1, max: 50 }),
    body('password').optional().isLength({ min: 6 })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token, firstName, lastName, password } = req.body;
    const organizationId = req.params.id;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const member = await TeamMember.findOne({ organizationId, inviteToken: hashedToken, inviteExpires: { $gt: new Date() } }).populate('userId');
    if (!member) {
      return res.status(400).json({ success: false, message: 'Invalid invitation' });
    }

    if (!member.verifyInviteToken(token)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invite token' });
    }

    if (firstName) member.userId.firstName = firstName;
    if (lastName) member.userId.lastName = lastName;
    if (password) member.userId.password = password;
    member.userId.status = 'active';
    member.userId.emailVerified = true;
    await member.userId.save();

    member.status = 'active';
    member.joinedAt = new Date();
    member.inviteToken = undefined;
    member.inviteExpires = undefined;
    await member.save();

    res.json({ success: true, message: 'Invitation accepted' });
  })
);

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const teamMemberships = await TeamMember.find({ userId: req.user.id })
    .populate('organizationId')
    .populate('organizationId');

  const organizations = teamMemberships.map(tm => ({
    id: tm.organizationId._id,
    name: tm.organizationId.name,
    description: tm.organizationId.description,
    logo: tm.organizationId.logo,
    domain: tm.organizationId.domain,
    role: tm.role,
    permissions: tm.permissions,
    subscription: tm.organizationId.subscription
  }));

  res.json({
    success: true,
    count: organizations.length,
    data: organizations
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const teamMembership = await TeamMember.findOne({
    userId: req.user.id,
    organizationId: req.params.id
  }).populate('organizationId');

  if (!teamMembership) {
    return res.status(404).json({
      success: false,
      message: 'Organization not found or access denied'
    });
  }

  res.json({
    success: true,
    data: {
      organization: teamMembership.organizationId,
      role: teamMembership.role,
      permissions: teamMembership.permissions
    }
  });
}));

router.get('/:id/team', asyncHandler(async (req, res) => {
  const membership = await TeamMember.findOne({ userId: req.user.id, organizationId: req.params.id });
  if (!membership) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const team = await TeamMember.find({ organizationId: req.params.id })
    .populate('userId', 'email firstName lastName avatar status');

  res.json({ success: true, count: team.length, data: team });
}));

router.post(
  '/:id/team/invite',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('role').optional().isIn(['owner', 'admin', 'manager', 'trainer', 'viewer']).withMessage('Invalid role')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const organizationId = req.params.id;
    const { email, role = 'viewer' } = req.body;

    const inviterMembership = await TeamMember.findOne({ userId: req.user.id, organizationId });
    if (!inviterMembership || !inviterMembership.canManageMembers()) {
      return res.status(403).json({ success: false, message: 'Not authorized to invite members' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      const tempPassword = crypto.randomBytes(8).toString('hex');
      user = await User.create({
        email,
        password: tempPassword,
        firstName: 'Invited',
        lastName: 'User',
        status: 'pending',
        emailVerified: false
      });
    }

    let member = await TeamMember.findOne({ userId: user._id, organizationId });
    if (!member) {
      member = new TeamMember({ organizationId, userId: user._id, role, status: 'invited', invitedBy: req.user.id, invitedAt: new Date() });
    } else {
      member.role = role;
      member.status = 'invited';
      member.invitedBy = req.user.id;
      member.invitedAt = new Date();
    }

    const rawToken = member.generateInviteToken();
    await member.save();

    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?org=${organizationId}&token=${rawToken}`;

    const emailResult = await emailService.sendTeamInviteEmail({
      toEmail: email,
      inviteUrl,
      organizationName: (await Organization.findById(organizationId)).name,
      inviterName: `${req.user.firstName} ${req.user.lastName}`,
      role
    });

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send invitation email.',
        details: emailResult.error
      });
    }

    await member.save();

    console.log(`Team invite email sent successfully to ${email}. Message ID: ${emailResult.messageId}`);

    res.status(201).json({ 
      success: true, 
      message: 'Invitation email sent successfully',
      data: { 
        memberId: member._id, 
        emailSent: true, 
        messageId: emailResult.messageId 
      }
    });
  })
);


router.patch(
  '/:id/team/:memberId/role',
  [
    param('memberId').isMongoId(),
    body('role').isIn(['owner', 'admin', 'manager', 'trainer', 'viewer']).withMessage('Invalid role')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const organizationId = req.params.id;
    const { role } = req.body;

    const actor = await TeamMember.findOne({ userId: req.user.id, organizationId });
    if (!actor || !actor.canManageMembers()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update roles' });
    }

    const member = await TeamMember.findOne({ _id: req.params.memberId, organizationId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    member.role = role;
    await member.save();

    res.json({ success: true, message: 'Role updated', data: member });
  })
);

module.exports = router;