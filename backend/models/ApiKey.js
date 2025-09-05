const mongoose = require('mongoose');

const ApiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a key name'],
    trim: true,
    maxlength: [100, 'Key name cannot be more than 100 characters']
  },
  key: {
    type: String,
    required: [true, 'Please add an API key']
  },
  type: {
    type: String,
    enum: ['openai', 'anthropic', 'google', 'custom'],
    required: [true, 'Please specify API key type']
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'completion',
      'chat',
      'embedding',
      'fine-tuning',
      'moderation',
      'image-generation',
      'audio-transcription'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  },
  rateLimit: {
    requestsPerMinute: {
      type: Number,
      default: 60
    },
    requestsPerHour: {
      type: Number,
      default: 1000
    },
    requestsPerDay: {
      type: Number,
      default: 10000
    }
  },
  settings: {
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 1000
    },
    timeout: {
      type: Number,
      default: 30000
    }
  },
  usage: {
    totalRequests: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    },
    lastReset: {
      type: Date,
      default: Date.now
    }
  },
  health: {
    status: {
      type: String,
      enum: ['healthy', 'warning', 'error', 'unknown'],
      default: 'unknown'
    },
    lastCheck: {
      type: Date
    },
    errorCount: {
      type: Number,
      default: 0
    },
    responseTime: {
      type: Number
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ApiKeySchema.virtual('organization', {
  ref: 'Organization',
  localField: 'organizationId',
  foreignField: '_id',
  justOne: true
});

ApiKeySchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

ApiKeySchema.index({ organizationId: 1, isActive: 1 });
ApiKeySchema.index({ type: 1 });
ApiKeySchema.index({ createdBy: 1 });
ApiKeySchema.index({ 'health.status': 1 });

ApiKeySchema.methods.isValid = function() {
  return this.isActive && this.health.status !== 'error';
};

ApiKeySchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

ApiKeySchema.methods.incrementUsage = function(tokens = 0, cost = 0) {
  this.usageCount += 1;
  this.lastUsed = new Date();
  this.usage.totalRequests += 1;
  this.usage.totalTokens += tokens;
  this.usage.totalCost += cost;
};

ApiKeySchema.methods.checkRateLimit = function() {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return {
    canMakeRequest: true,
    remainingRequests: {
      perMinute: this.rateLimit.requestsPerMinute,
      perHour: this.rateLimit.requestsPerHour,
      perDay: this.rateLimit.requestsPerDay
    }
  };
};

ApiKeySchema.methods.updateHealth = function(status, responseTime = null) {
  this.health.status = status;
  this.health.lastCheck = new Date();
  
  if (responseTime !== null) {
    this.health.responseTime = responseTime;
  }
  
  if (status === 'error') {
    this.health.errorCount += 1;
  } else if (status === 'healthy') {
    this.health.errorCount = 0;
  }
};

ApiKeySchema.methods.resetUsage = function() {
  this.usage.totalRequests = 0;
  this.usage.totalTokens = 0;
  this.usage.totalCost = 0;
  this.usage.lastReset = new Date();
};

ApiKeySchema.statics.validateKeyFormat = function(type, key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  switch (type) {
    case 'openai':
      return trimmed.length >= 16;
    case 'anthropic':
      return trimmed.length >= 16;
    case 'google':
      return trimmed.length >= 16;
    case 'custom':
      return trimmed.length >= 8;
    default:
      return trimmed.length >= 8;
  }
};

ApiKeySchema.statics.findActiveByType = function(type, organizationId) {
  return this.find({
    type,
    organizationId,
    isActive: true,
    'health.status': { $ne: 'error' }
  });
};

ApiKeySchema.statics.getUsageStats = function(organizationId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        organizationId: mongoose.Types.ObjectId(organizationId),
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        totalKeys: { $sum: 1 },
        activeKeys: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        totalUsage: { $sum: '$usage.totalRequests' },
        totalTokens: { $sum: '$usage.totalTokens' },
        totalCost: { $sum: '$usage.totalCost' }
      }
    }
  ]);
};

module.exports = mongoose.model('ApiKey', ApiKeySchema);