const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const { protect } = require('../middleware/auth');
const Trainer = require('../models/Trainer');
const TrainerFlow = require('../models/TrainerFlow');

const router = express.Router();

router.use(protect);

// Get latest flow for a trainer
router.get('/:trainerId/latest', asyncHandler(async (req, res) => {
  const { trainerId } = req.params;
  const { status } = req.query;

  // Verify trainer exists and user has access
  const trainer = await Trainer.findById(trainerId);
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

  // Build query
  const query = { trainerId: trainer._id };
  if (status) {
    query.status = status;
  }

  // Get latest flow
  const flow = await TrainerFlow.findOne(query)
    .sort({ createdAt: -1 })
    .lean();

  if (!flow) {
    return res.status(404).json({
      success: false,
      message: 'No flow found for this trainer'
    });
  }

  res.status(200).json({
    success: true,
    data: flow
  });
}));

// Create new flow for a trainer
router.post('/:trainerId', [
  body('name').notEmpty().withMessage('Flow name is required'),
  body('nodes').isArray().withMessage('Nodes must be an array'),
  body('edges').isArray().withMessage('Edges must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { trainerId } = req.params;
  const { name, nodes, edges, settings } = req.body;

  // Verify trainer exists and user has access
  const trainer = await Trainer.findById(trainerId);
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

  // Create new flow
  const flow = await TrainerFlow.create({
    trainerId: trainer._id,
    name,
    version: '1.0.0',
    nodes,
    edges,
    settings: settings || {},
    status: 'draft',
    metadata: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      complexity: nodes.length > 10 ? 'medium' : 'low',
      estimatedDuration: Math.ceil(nodes.length * 2)
    }
  });

  res.status(201).json({
    success: true,
    message: 'Flow created successfully',
    data: flow
  });
}));

// Update existing flow
router.put('/:flowId', [
  body('name').optional().notEmpty().withMessage('Flow name cannot be empty'),
  body('nodes').optional().isArray().withMessage('Nodes must be an array'),
  body('edges').optional().isArray().withMessage('Edges must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { flowId } = req.params;
  const updates = req.body;

  // Find flow and verify access
  const flow = await TrainerFlow.findById(flowId).populate('trainerId');
  if (!flow) {
    return res.status(404).json({
      success: false,
      message: 'Flow not found'
    });
  }

  if (!flow.trainerId.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this flow'
    });
  }

  // Update metadata if nodes/edges changed
  if (updates.nodes || updates.edges) {
    updates.metadata = {
      ...flow.metadata,
      totalNodes: updates.nodes ? updates.nodes.length : flow.metadata.totalNodes,
      totalEdges: updates.edges ? updates.edges.length : flow.metadata.totalEdges,
      complexity: (updates.nodes ? updates.nodes.length : flow.metadata.totalNodes) > 10 ? 'medium' : 'low',
      estimatedDuration: Math.ceil((updates.nodes ? updates.nodes.length : flow.metadata.totalNodes) * 2)
    };
  }

  // Update flow
  const updatedFlow = await TrainerFlow.findByIdAndUpdate(
    flowId,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Flow updated successfully',
    data: updatedFlow
  });
}));

// Validate flow structure
router.post('/validate', asyncHandler(async (req, res) => {
  console.log('Validation request received:', { 
    body: req.body, 
    contentType: req.get('Content-Type'),
    hasNodes: !!req.body.nodes,
    hasEdges: !!req.body.edges,
    nodesType: typeof req.body.nodes,
    edgesType: typeof req.body.edges
  });
  
  const { nodes, edges, settings } = req.body;
  
  // Basic validation
  if (!nodes || !Array.isArray(nodes)) {
    return res.status(400).json({
      success: false,
      message: 'Nodes must be an array',
      received: { nodes: req.body.nodes, type: typeof req.body.nodes }
    });
  }
  
  if (!edges || !Array.isArray(edges)) {
    return res.status(400).json({
      success: false,
      message: 'Edges must be an array',
      received: { edges: req.body.edges, type: typeof req.body.edges }
    });
  }

  const validationErrors = [];

  // Basic validation rules
  if (!nodes || nodes.length === 0) {
    validationErrors.push('Flow must have at least one node');
  }

  if (!edges || edges.length === 0) {
    validationErrors.push('Flow must have at least one edge');
  }

  // Check for start node
  const hasStartNode = nodes.some(node => node.type === 'start');
  if (!hasStartNode) {
    validationErrors.push('Flow must have exactly one start node');
  }

  // Check for multiple start nodes
  const startNodes = nodes.filter(node => node.type === 'start');
  if (startNodes.length > 1) {
    validationErrors.push('Flow can only have one start node');
  }

  // Check for end nodes
  const hasEndNode = nodes.some(node => node.type === 'end');
  if (!hasEndNode) {
    validationErrors.push('Flow must have at least one end node');
  }

  // Check for orphaned nodes (nodes with no connections)
  const connectedNodes = new Set();
  edges.forEach(edge => {
    connectedNodes.add(edge.from);
    connectedNodes.add(edge.to);
  });

  const orphanedNodes = nodes.filter(node => !connectedNodes.has(node.id));
  if (orphanedNodes.length > 0) {
    validationErrors.push(`Found ${orphanedNodes.length} orphaned node(s): ${orphanedNodes.map(n => n.label).join(', ')}`);
  }

  // Check for invalid edge references
  const nodeIds = new Set(nodes.map(node => node.id));
  const invalidEdges = edges.filter(edge => 
    !nodeIds.has(edge.from) || !nodeIds.has(edge.to)
  );
  if (invalidEdges.length > 0) {
    validationErrors.push(`Found ${invalidEdges.length} invalid edge(s) referencing non-existent nodes`);
  }

  // Check for decision nodes with proper choices
  const decisionNodes = nodes.filter(node => node.type === 'decision');
  decisionNodes.forEach(node => {
    if (!node.data.choices || node.data.choices.length < 2) {
      validationErrors.push(`Decision node "${node.label}" must have at least 2 choices`);
    }
  });

  // Check for question nodes with keywords
  const questionNodes = nodes.filter(node => node.type === 'question');
  questionNodes.forEach(node => {
    if (!node.data.keywords || node.data.keywords.length === 0) {
      validationErrors.push(`Question node "${node.label}" should have keywords for better matching`);
    }
  });

  const isValid = validationErrors.length === 0;

  res.status(200).json({
    success: true,
    data: {
      isValid,
      errors: validationErrors,
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        startNodes: startNodes.length,
        endNodes: nodes.filter(n => n.type === 'end').length,
        orphanedNodes: orphanedNodes.length,
        invalidEdges: invalidEdges.length
      }
    }
  });
}));

// Publish flow
router.post('/:flowId/publish', asyncHandler(async (req, res) => {
  const { flowId } = req.params;

  // Find flow and verify access
  const flow = await TrainerFlow.findById(flowId).populate('trainerId');
  if (!flow) {
    return res.status(404).json({
      success: false,
      message: 'Flow not found'
    });
  }

  if (!flow.trainerId.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this flow'
    });
  }

  // First validate the flow
  const validationErrors = [];
  
  // Basic validation
  if (!flow.nodes || flow.nodes.length === 0) {
    validationErrors.push('Flow must have at least one node');
  }

  if (!flow.edges || flow.edges.length === 0) {
    validationErrors.push('Flow must have at least one edge');
  }

  const hasStartNode = flow.nodes.some(node => node.type === 'start');
  if (!hasStartNode) {
    validationErrors.push('Flow must have exactly one start node');
  }

  const hasEndNode = flow.nodes.some(node => node.type === 'end');
  if (!hasEndNode) {
    validationErrors.push('Flow must have at least one end node');
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Flow validation failed',
      errors: validationErrors
    });
  }

  // Update all other flows for this trainer to draft status
  await TrainerFlow.updateMany(
    { trainerId: flow.trainerId._id, _id: { $ne: flowId } },
    { status: 'draft' }
  );

  // Publish this flow
  const publishedFlow = await TrainerFlow.findByIdAndUpdate(
    flowId,
    { 
      status: 'published',
      publishedAt: new Date(),
      publishedBy: req.user.id
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Flow published successfully',
    data: publishedFlow
  });
}));

// Get all flows for a trainer
router.get('/:trainerId/all', asyncHandler(async (req, res) => {
  const { trainerId } = req.params;

  // Verify trainer exists and user has access
  const trainer = await Trainer.findById(trainerId);
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

  // Get all flows for this trainer
  const flows = await TrainerFlow.find({ trainerId: trainer._id })
    .sort({ createdAt: -1 })
    .select('name version status createdAt updatedAt publishedAt metadata')
    .lean();

  res.status(200).json({
    success: true,
    data: flows
  });
}));

// Delete flow
router.delete('/:flowId', asyncHandler(async (req, res) => {
  const { flowId } = req.params;

  // Find flow and verify access
  const flow = await TrainerFlow.findById(flowId).populate('trainerId');
  if (!flow) {
    return res.status(404).json({
      success: false,
      message: 'Flow not found'
    });
  }

  if (!flow.trainerId.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this flow'
    });
  }

  // Don't allow deletion of published flows
  if (flow.status === 'published') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete published flow. Unpublish it first.'
    });
  }

  await TrainerFlow.findByIdAndDelete(flowId);

  res.status(200).json({
    success: true,
    message: 'Flow deleted successfully'
  });
}));

module.exports = router;