const express = require('express');
const { protect } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');

const Session = require('../models/Session');
const Trainer = require('../models/Trainer');
const TrainerFlow = require('../models/TrainerFlow');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Utility: load latest flow (prefer draft, else published)
async function loadLatestFlowForTrainer(trainerId) {
  const draft = await TrainerFlow.findOne({ trainerId, status: 'draft' }).sort({ createdAt: -1 }).lean();
  if (draft) return draft;
  const published = await TrainerFlow.findOne({ trainerId, status: 'published' }).sort({ createdAt: -1 }).lean();
  return published;
}

// Utility: choose next node id based on edges and optional user input
function selectNextNodeId(currentNode, edgesFromNode, userText) {
  if (!Array.isArray(edgesFromNode) || edgesFromNode.length === 0) return null;
  // Very basic routing: if decision/question with keywords, try match, else take first
  const lower = (userText || '').toLowerCase();
  for (const e of edgesFromNode) {
    const cond = e.condition || {};
    if (cond.type === 'question' && Array.isArray(cond.keywords) && cond.keywords.length) {
      if (cond.keywords.some(k => lower.includes(String(k).toLowerCase()))) return e.to;
    }
  }
  // Fallback: first edge
  return edgesFromNode[0].to;
}

// Utility: build AI message content for a node
function nodeToAiMessage(node) {
  if (!node) return 'Flow ended.';
  const data = node.data || {};
  if (Array.isArray(data.messages) && data.messages.length) return data.messages[0];
  if (typeof data.textDraft === 'string' && data.textDraft.trim()) return data.textDraft;
  return node.label || '...';
}

// @desc    Get user sessions
// @route   GET /api/sessions
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { trainerId, organizationId } = req.query;
  
  const query = { userId: req.user.id };
  if (trainerId) query.trainerId = trainerId;
  if (organizationId) query.organizationId = organizationId;

  const sessions = await Session.find(query)
    .populate('trainerId', 'name type')
    .sort('-createdAt');

  res.json({
    success: true,
    count: sessions.length,
    data: sessions
  });
}));

// @desc    Create/start a session and return initial message from flow
// @route   POST /api/sessions
// @access  Private
router.post('/', asyncHandler(async (req, res) => {
  const { trainerId, organizationId, isAnonymous } = req.body || {};

  if (!trainerId || !organizationId) {
    return res.status(400).json({ success: false, message: 'trainerId and organizationId are required' });
  }

  const trainer = await Trainer.findById(trainerId);
  if (!trainer) {
    return res.status(404).json({ success: false, message: 'Trainer not found' });
  }
  if (!trainer.canBeAccessedBy || !trainer.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({ success: false, message: 'Not authorized to access this trainer' });
  }

  const flow = await loadLatestFlowForTrainer(trainer._id);
  if (!flow) {
    return res.status(400).json({ success: false, message: 'No flow available for this trainer' });
  }

  // Determine start node
  const startNodeId = flow.settings?.startNode || (flow.nodes || []).find(n => n.type === 'start')?.id || (flow.nodes?.[0]?.id);
  const startNode = (flow.nodes || []).find(n => n.id === startNodeId) || null;

  const session = await Session.create({
    sessionId: `${trainerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    trainerId: trainer._id,
    userId: req.user._id,
    organizationId,
    status: 'active',
    progress: {
      currentNode: startNodeId || null,
      completedNodes: [],
      score: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      attempts: 0,
      completionPercentage: 0
    },
    settings: {
      isAnonymous: !!isAnonymous,
      allowTracking: true,
      language: 'en'
    },
    conversation: []
  });

  let initialAi = null;
  if (startNode) {
    const mediaUrl = (startNode.type === 'image' && startNode.data && startNode.data.mediaUrl)
      ? startNode.data.mediaUrl
      : undefined;
    const msg = {
      id: `m_${Date.now()}`,
      type: 'ai',
      content: nodeToAiMessage(startNode),
      nodeId: startNode.id,
      timestamp: new Date(),
      ...(mediaUrl ? { mediaUrl } : {})
    };
    session.addMessage(msg);
    await session.save();
    initialAi = msg;
  }

  res.status(201).json({ success: true, data: { sessionId: session.sessionId, id: session._id, initialMessage: initialAi } });
}));

// @desc    Send a user message and advance flow
// @route   POST /api/sessions/:id/messages
// @access  Private
router.post('/:id/messages', asyncHandler(async (req, res) => {
  const { message } = req.body || {};
  const session = await Session.findOne({ _id: req.params.id, userId: req.user.id });
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  const flow = await loadLatestFlowForTrainer(session.trainerId);
  if (!flow) {
    return res.status(400).json({ success: false, message: 'No flow available for this trainer' });
  }

  const nodes = flow.nodes || [];
  const edges = flow.edges || [];
  const currentNode = nodes.find(n => n.id === session.progress.currentNode) || null;

  // Record user message
  if (message && String(message).trim()) {
    session.addMessage({
      id: `u_${Date.now()}`,
      type: 'user',
      content: String(message),
      timestamp: new Date(),
      nodeId: currentNode?.id
    });
  }

  // Determine next node
  let nextNode = null;
  if (!currentNode) {
    const startNodeId = flow.settings?.startNode || nodes.find(n => n.type === 'start')?.id || nodes[0]?.id;
    nextNode = nodes.find(n => n.id === startNodeId) || null;
  } else {
    const fromEdges = edges.filter(e => e.from === currentNode.id);
    const nextId = selectNextNodeId(currentNode, fromEdges, message);
    nextNode = nextId ? nodes.find(n => n.id === nextId) || null : null;
  }

  let aiMessage = null;
  if (nextNode) {
    session.progress.currentNode = nextNode.id;
    const mediaUrl = (nextNode.type === 'image' && nextNode.data && nextNode.data.mediaUrl)
      ? nextNode.data.mediaUrl
      : undefined;
    aiMessage = {
      id: `a_${Date.now()}`,
      type: 'ai',
      content: nodeToAiMessage(nextNode),
      timestamp: new Date(),
      nodeId: nextNode.id,
      ...(mediaUrl ? { mediaUrl } : {})
    };
    session.addMessage(aiMessage);
  } else {
    // End session if no next node
    session.complete();
    aiMessage = {
      id: `a_${Date.now()}`,
      type: 'ai',
      content: 'Session completed. Great job!',
      timestamp: new Date(),
      nodeId: currentNode?.id
    };
    session.addMessage(aiMessage);
  }

  await session.save();

  res.json({ success: true, data: { aiMessage, status: session.status } });
}));

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const session = await Session.findOne({
    _id: req.params.id,
    userId: req.user.id
  }).populate('trainerId', 'name type');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  res.json({
    success: true,
    data: session
  });
}));

module.exports = router;
