const mongoose = require('mongoose');

const NodeDataSchema = new mongoose.Schema({
  textDraft: {
    type: String,
    maxlength: [2000, 'Text draft cannot be more than 2000 characters']
  },
  messages: [{
    type: String,
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  }],
  keywords: [{
    type: String,
    maxlength: [50, 'Keyword cannot be more than 50 characters']
  }],
  errorMessage: {
    type: String,
    maxlength: [500, 'Error message cannot be more than 500 characters']
  },
  choices: [{
    type: String,
    maxlength: [200, 'Choice cannot be more than 200 characters']
  }],
  mediaUrl: {
    type: String
  },
  conditions: [{
    type: {
      type: String,
      enum: ['text', 'score', 'time', 'custom']
    },
    value: String,
    action: {
      type: String,
      enum: ['redirect', 'show', 'hide', 'end']
    }
  }],
  validation: {
    required: {
      type: Boolean,
      default: false
    },
    minLength: {
      type: Number,
      min: 0
    },
    maxLength: {
      type: Number,
      min: 0
    },
    pattern: String
  }
}, { _id: false });

const NodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['start', 'text', 'image', 'audio', 'video', 'question', 'decision', 'feedback', 'assessment', 'end'],
    required: true
  },
  label: {
    type: String,
    required: true,
    maxlength: [100, 'Label cannot be more than 100 characters']
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  w: {
    type: Number,
    default: 200
  },
  h: {
    type: Number,
    default: 100
  },
  data: {
    type: NodeDataSchema,
    default: {}
  }
}, { _id: false });

const EdgeConditionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['auto', 'decision', 'question'],
    required: true
  },
  choiceKey: String,
  keywords: [{
    type: String,
    maxlength: [50, 'Keyword cannot be more than 50 characters']
  }],
  logic: {
    type: String,
    enum: ['and', 'or', 'not'],
    default: 'and'
  }
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  label: {
    type: String,
    maxlength: [100, 'Label cannot be more than 100 characters']
  },
  condition: {
    type: EdgeConditionSchema,
    default: {}
  }
}, { _id: false });

const TrainerFlowSchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  version: {
    type: String,
    required: true,
    default: '1.0.0'
  },
  name: {
    type: String,
    required: true,
    maxlength: [100, 'Flow name cannot be more than 100 characters']
  },
  nodes: [{
    type: NodeSchema,
    required: true
  }],
  edges: [{
    type: EdgeSchema,
    required: true
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  settings: {
    startNode: {
      type: String
    },
    endNodes: [{
      type: String
    }],
    maxDepth: {
      type: Number,
      default: 10
    },
    allowLoops: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    totalNodes: {
      type: Number,
      default: 0
    },
    totalEdges: {
      type: Number,
      default: 0
    },
    complexity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    estimatedDuration: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

TrainerFlowSchema.virtual('trainer', {
  ref: 'Trainer',
  localField: 'trainerId',
  foreignField: '_id',
  justOne: true
});

TrainerFlowSchema.index({ trainerId: 1, version: 1 });
TrainerFlowSchema.index({ trainerId: 1, isPublished: 1 });
TrainerFlowSchema.index({ publishedBy: 1 });

TrainerFlowSchema.pre('save', function(next) {
  this.metadata.totalNodes = this.nodes.length;
  this.metadata.totalEdges = this.edges.length;
  
  const complexity = this.nodes.length + this.edges.length;
  if (complexity <= 10) {
    this.metadata.complexity = 'low';
  } else if (complexity <= 30) {
    this.metadata.complexity = 'medium';
  } else {
    this.metadata.complexity = 'high';
  }
  
  this.metadata.estimatedDuration = Math.ceil(this.nodes.length * 2);
  
  next();
});

TrainerFlowSchema.methods.validateFlow = function() {
  const errors = [];
  
  const startNodes = this.nodes.filter(node => node.type === 'start');
  if (startNodes.length === 0) {
    errors.push('Flow must have exactly one start node');
  } else if (startNodes.length > 1) {
    errors.push('Flow can only have one start node');
  }
  
  const endNodes = this.nodes.filter(node => node.type === 'end');
  if (endNodes.length === 0) {
    errors.push('Flow must have at least one end node');
  }
  
  const connectedNodes = new Set();
  this.edges.forEach(edge => {
    connectedNodes.add(edge.from);
    connectedNodes.add(edge.to);
  });
  
  this.nodes.forEach(node => {
    if (!connectedNodes.has(node.id) && node.type !== 'start' && node.type !== 'end') {
      errors.push(`Node "${node.label}" is not connected to the flow`);
    }
  });
  
  if (!this.settings.allowLoops) {
    const visited = new Set();
    const recStack = new Set();
    
    const hasCycle = (nodeId) => {
      if (recStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visited.add(nodeId);
      recStack.add(nodeId);
      
      const outgoingEdges = this.edges.filter(edge => edge.from === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.to)) return true;
      }
      
      recStack.delete(nodeId);
      return false;
    };
    
    const startNode = this.nodes.find(node => node.type === 'start');
    if (startNode && hasCycle(startNode.id)) {
      errors.push('Flow contains cycles which are not allowed');
    }
  }
  
  return errors;
};

TrainerFlowSchema.methods.publish = function(userId) {
  const validationErrors = this.validateFlow();
  if (validationErrors.length > 0) {
    throw new Error(`Cannot publish flow: ${validationErrors.join(', ')}`);
  }
  
  this.isPublished = true;
  this.publishedAt = new Date();
  this.publishedBy = userId;
};

TrainerFlowSchema.methods.unpublish = function() {
  this.isPublished = false;
  this.publishedAt = null;
  this.publishedBy = null;
};

TrainerFlowSchema.methods.getStartNode = function() {
  return this.nodes.find(node => node.type === 'start');
};

TrainerFlowSchema.methods.getEndNodes = function() {
  return this.nodes.filter(node => node.type === 'end');
};

TrainerFlowSchema.methods.getNodeById = function(nodeId) {
  return this.nodes.find(node => node.id === nodeId);
};

TrainerFlowSchema.methods.getOutgoingEdges = function(nodeId) {
  return this.edges.filter(edge => edge.from === nodeId);
};

TrainerFlowSchema.methods.getIncomingEdges = function(nodeId) {
  return this.edges.filter(edge => edge.to === nodeId);
};

module.exports = mongoose.model('TrainerFlow', TrainerFlowSchema);