const mongoose = require('mongoose');

const UserResponseSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true
  },
  question: {
    type: String,
    maxlength: [500, 'Question cannot be more than 500 characters']
  },
  answer: {
    type: String,
    maxlength: [2000, 'Answer cannot be more than 2000 characters']
  },
  isCorrect: {
    type: Boolean
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  responseTime: {
    type: Number,
    min: 0
  },
  feedback: {
    type: String,
    maxlength: [500, 'Feedback cannot be more than 500 characters']
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  attempts: {
    type: Number,
    default: 1,
    min: 1
  }
}, { _id: false });

const ConversationMessageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['ai', 'user', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [2000, 'Message content cannot be more than 2000 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  nodeId: {
    type: String
  },
  metadata: {
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    intent: String,
    entities: [String]
  }
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned', 'paused'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  progress: {
    currentNode: {
      type: String
    },
    completedNodes: [{
      type: String
    }],
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    attempts: {
      type: Number,
      default: 0
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  userResponses: [{
    type: UserResponseSchema
  }],
  conversation: [{
    type: ConversationMessageSchema
  }],
  metadata: {
    userAgent: {
      type: String,
      maxlength: [500, 'User agent cannot be more than 500 characters']
    },
    ipAddress: {
      type: String,
      maxlength: [45, 'IP address cannot be more than 45 characters']
    },
    location: {
      country: String,
      region: String,
      city: String
    },
    device: {
      type: String,
      enum: ['desktop', 'tablet', 'mobile', 'unknown']
    },
    browser: {
      name: String,
      version: String
    },
    os: {
      name: String,
      version: String
    }
  },
  settings: {
    isAnonymous: {
      type: Boolean,
      default: false
    },
    allowTracking: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  analytics: {
    totalInteractions: {
      type: Number,
      default: 0
    },
    avgResponseTime: {
      type: Number,
      default: 0
    },
    engagementScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

SessionSchema.virtual('trainer', {
  ref: 'Trainer',
  localField: 'trainerId',
  foreignField: '_id',
  justOne: true
});

SessionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

SessionSchema.virtual('organization', {
  ref: 'Organization',
  localField: 'organizationId',
  foreignField: '_id',
  justOne: true
});

SessionSchema.index({ sessionId: 1 }, { unique: true });
SessionSchema.index({ trainerId: 1, status: 1 });
SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ organizationId: 1, createdAt: -1 });
SessionSchema.index({ startTime: -1 });
SessionSchema.index({ 'progress.score': -1 });

SessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  
  if (this.progress.totalQuestions > 0) {
    this.progress.completionPercentage = Math.round((this.progress.completedNodes.length / this.progress.totalQuestions) * 100);
  }
  
  if (this.userResponses.length > 0) {
    const totalResponseTime = this.userResponses.reduce((sum, response) => sum + (response.responseTime || 0), 0);
    this.analytics.avgResponseTime = Math.round(totalResponseTime / this.userResponses.length);
  }
  
  this.analytics.engagementScore = this.calculateEngagementScore();
  
  next();
});

SessionSchema.methods.addUserResponse = function(response) {
  this.userResponses.push(response);
  this.progress.attempts += 1;
  
  if (response.isCorrect) {
    this.progress.correctAnswers += 1;
  }
  
  if (!this.userResponses.some(r => r.nodeId === response.nodeId)) {
    this.progress.totalQuestions += 1;
  }
  
  if (this.progress.totalQuestions > 0) {
    this.progress.score = Math.round((this.progress.correctAnswers / this.progress.totalQuestions) * 100);
  }
  
  if (!this.progress.completedNodes.includes(response.nodeId)) {
    this.progress.completedNodes.push(response.nodeId);
  }
  
  this.analytics.totalInteractions += 1;
};

SessionSchema.methods.addMessage = function(message) {
  this.conversation.push(message);
  this.analytics.totalInteractions += 1;
};

SessionSchema.methods.complete = function() {
  this.status = 'completed';
  this.endTime = new Date();
  
  if (this.progress.totalQuestions > 0) {
    this.progress.score = Math.round((this.progress.correctAnswers / this.progress.totalQuestions) * 100);
  }
  
  this.progress.completionPercentage = 100;
};

SessionSchema.methods.abandon = function() {
  this.status = 'abandoned';
  this.endTime = new Date();
};

SessionSchema.methods.pause = function() {
  this.status = 'paused';
};

SessionSchema.methods.resume = function() {
  this.status = 'active';
};

SessionSchema.methods.calculateEngagementScore = function() {
  let score = 0;
  
  score += this.progress.completionPercentage * 0.4;
  
  if (this.progress.totalQuestions > 0) {
    score += (this.progress.correctAnswers / this.progress.totalQuestions) * 30;
  }
  
  const sessionDuration = this.duration || 1;
  const interactionsPerMinute = (this.analytics.totalInteractions / sessionDuration) * 60;
  score += Math.min(interactionsPerMinute * 2, 20);
  
  if (this.analytics.avgResponseTime > 0) {
    const responseTimeScore = Math.max(0, 10 - (this.analytics.avgResponseTime / 10));
    score += responseTimeScore;
  }
  
  return Math.min(Math.round(score), 100);
};

SessionSchema.methods.getSummary = function() {
  return {
    sessionId: this.sessionId,
    trainerId: this.trainerId,
    status: this.status,
    duration: this.duration,
    score: this.progress.score,
    completionPercentage: this.progress.completionPercentage,
    totalInteractions: this.analytics.totalInteractions,
    engagementScore: this.analytics.engagementScore,
    startTime: this.startTime,
    endTime: this.endTime
  };
};

module.exports = mongoose.model('Session', SessionSchema);