const express = require('express');
const { protect } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');

const ApiKey = require('../models/ApiKey');

const router = express.Router();

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const { organizationId } = req.query;
  
  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: 'Organization ID is required'
    });
  }

  const apiKeys = await ApiKey.find({ organizationId })
    .populate('createdBy', 'firstName lastName')
    .sort('-createdAt');

  const sanitized = apiKeys.map(k => ({
    _id: k._id,
    name: k.name,
    type: k.type,
    organizationId: k.organizationId,
    createdBy: k.createdBy,
    permissions: k.permissions,
    isActive: k.isActive,
    isVisible: k.isVisible,
    lastUsed: k.lastUsed,
    usageCount: k.usageCount,
    rateLimit: k.rateLimit,
    settings: k.settings,
    usage: k.usage,
    health: k.health,
    createdAt: k.createdAt,
    updatedAt: k.updatedAt,
    key: k.key
  }));

  res.json({
    success: true,
    count: sanitized.length,
    data: sanitized
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, key, type, organizationId, permissions, settings, rateLimit } = req.body;

  if (!organizationId || !name || !key || !type) {
    return res.status(400).json({ success: false, message: 'name, key, type, organizationId are required' });
  }

  if (!ApiKey.validateKeyFormat(type, key)) {
    return res.status(400).json({ success: false, message: 'Invalid API key format for type' });
  }

  const created = await ApiKey.create({
    name,
    type,
    organizationId,
    createdBy: req.user.id,
    permissions: permissions || [],
    key,
    settings: settings || undefined,
    rateLimit: rateLimit || undefined
  });

  res.status(201).json({
    success: true,
    data: {
      _id: created._id,
      name: created.name,
      type: created.type,
      organizationId: created.organizationId,
      createdBy: created.createdBy,
      permissions: created.permissions,
      isActive: created.isActive,
      isVisible: created.isVisible,
      key: created.key,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    }
  });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, key, permissions, settings, rateLimit, isActive, isVisible } = req.body;

  const existing = await ApiKey.findById(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'API key not found' });
  }

  if (name !== undefined) existing.name = name;
  if (permissions !== undefined) existing.permissions = permissions;
  if (settings !== undefined) existing.settings = settings;
  if (rateLimit !== undefined) existing.rateLimit = rateLimit;
  if (typeof isActive === 'boolean') existing.isActive = isActive;
  if (typeof isVisible === 'boolean') existing.isVisible = isVisible;

  if (key) {
    if (!ApiKey.validateKeyFormat(existing.type, key)) {
      return res.status(400).json({ success: false, message: 'Invalid API key format for type' });
    }
    existing.key = key;
  }

  await existing.save();

  res.json({
    success: true,
    data: {
      _id: existing._id,
      name: existing.name,
      type: existing.type,
      organizationId: existing.organizationId,
      createdBy: existing.createdBy,
      permissions: existing.permissions,
      isActive: existing.isActive,
      isVisible: existing.isVisible,
      key: existing.key,
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt
    }
  });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await ApiKey.findById(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'API key not found' });
  }

  await ApiKey.findByIdAndDelete(id);

  res.json({ success: true, message: 'API key deleted successfully' });
}));

module.exports = router;