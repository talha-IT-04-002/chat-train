const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

const Trainer = require('../models/Trainer');
const TrainerFlow = require('../models/TrainerFlow');
const TeamMember = require('../models/TeamMember');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, type, search, organizationId } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;

  const baseQuery = {};

  if (status) {
    baseQuery.status = status;
  }

  if (type) {
    baseQuery.type = type;
  }

  if (search) {
    baseQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Determine user's organizations via TeamMember since req.user.organizations is not populated here
  let organizationIds = [];
  if (organizationId) {
    organizationIds = [organizationId];
  } else {
    const memberships = await TeamMember.find({ userId: req.user._id });
    organizationIds = memberships.map(m => m.organizationId);
  }

  if (organizationIds.length === 0) {
    return res.json({
      success: true,
      count: 0,
      total: 0,
      page: pageNum,
      pages: 0,
      data: []
    });
  }

  const accessFilter = {
    $or: [
      { organizationId: { $in: organizationIds } },
      { createdBy: req.user._id },
      { 'settings.isPublic': true }
    ]
  };

  const query = Object.keys(baseQuery).length > 0 ? { $and: [baseQuery, accessFilter] } : accessFilter;

  const trainers = await Trainer.find(query)
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .sort('-createdAt')
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum);

  const total = await Trainer.countDocuments(query);

  res.json({
    success: true,
    count: trainers.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: trainers
  });
}));

router.get('/:id/flows', asyncHandler(async (req, res) => {
  const trainer = await Trainer.findById(req.params.id);

  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer not found'
    });
  }

  if (!trainer.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this trainer'
    });
  }

  const flows = await TrainerFlow.find({ trainerId: trainer._id })
    .populate('publishedBy', 'firstName lastName')
    .sort('-createdAt');

  res.json({
    success: true,
    count: flows.length,
    data: flows
  });
}));

router.get('/:id/analytics', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const trainer = await Trainer.findById(req.params.id);

  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer not found'
    });
  }

  if (!trainer.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this trainer'
    });
  }

  const analytics = {
    totalSessions: trainer.metadata.totalSessions,
    completionRate: trainer.metadata.completionRate,
    avgSessionTime: trainer.metadata.avgSessionTime,
    totalInteractions: trainer.metadata.totalInteractions
  };

  res.json({
    success: true,
    data: analytics
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const trainer = await Trainer.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .populate('aiConfig.apiKeyId', 'name type');

  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer not found'
    });
  }

  if (!trainer.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this trainer'
    });
  }

  res.json({
    success: true,
    data: trainer
  });
}));

router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Trainer name is required and must be less than 100 characters'),
  body('type')
    .isIn(['compliance', 'sales', 'customer-service', 'onboarding', 'soft-skills', 'knowledge-qa', 'custom'])
    .withMessage('Invalid trainer type'),
  body('organizationId')
    .isMongoId()
    .withMessage('Valid organization ID is required'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('learningObjectives')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Learning objectives must be less than 1000 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    name,
    description,
    type,
    category,
    organizationId,
    assignedTo,
    tags,
    learningObjectives,
    settings,
    aiConfig
  } = req.body;

  const trainer = await Trainer.create({
    name,
    description,
    type,
    category,
    organizationId,
    createdBy: req.user.id,
    assignedTo: assignedTo || [],
    tags: tags || [],
    learningObjectives,
    settings: settings || {},
    aiConfig: aiConfig || {}
  });

  res.status(201).json({
    success: true,
    message: 'Trainer created successfully',
    data: trainer
  });
}));

router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Trainer name must be less than 100 characters'),
  body('type')
    .optional()
    .isIn(['compliance', 'sales', 'customer-service', 'onboarding', 'soft-skills', 'knowledge-qa', 'custom'])
    .withMessage('Invalid trainer type'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('learningObjectives')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Learning objectives must be less than 1000 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const trainer = await Trainer.findById(req.params.id);

  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer not found'
    });
  }

  if (!trainer.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this trainer'
    });
  }

  const updatedTrainer = await Trainer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('createdBy', 'firstName lastName email')
   .populate('assignedTo', 'firstName lastName email');

  res.json({
    success: true,
    message: 'Trainer updated successfully',
    data: updatedTrainer
  });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const trainer = await Trainer.findById(req.params.id);

  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer not found'
    });
  }

  if (!trainer.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this trainer'
    });
  }

  // Use deleteOne instead of deprecated remove
  await trainer.deleteOne();

  res.json({
    success: true,
    message: 'Trainer deleted successfully'
  });
}));

router.post('/:id/deploy', asyncHandler(async (req, res) => {
  const trainer = await Trainer.findById(req.params.id);

  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer not found'
    });
  }

  if (!trainer.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to deploy this trainer'
    });
  }

  trainer.deploy();
  await trainer.save();

  res.json({
    success: true,
    message: 'Trainer deployed successfully',
    data: trainer
  });
}));

router.post('/:id/undeploy', asyncHandler(async (req, res) => {
  const trainer = await Trainer.findById(req.params.id);

  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer not found'
    });
  }

  if (!trainer.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to undeploy this trainer'
    });
  }

  trainer.undeploy();
  await trainer.save();

  res.json({
    success: true,
    message: 'Trainer undeployed successfully',
    data: trainer
  });
}));

module.exports = router;