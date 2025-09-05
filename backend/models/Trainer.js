const mongoose = require('mongoose');
const TrainerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a trainer name'],
    trim: true,
    maxlength: [100, 'Trainer name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: ['compliance', 'sales', 'customer-service', 'onboarding', 'soft-skills', 'knowledge-qa', 'custom'],
    required: [true, 'Please specify trainer type']
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  category: {
    type: String,
    maxlength: [50, 'Category cannot be more than 50 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived', 'testing'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  learningObjectives: {
    type: String,
    maxlength: [1000, 'Learning objectives cannot be more than 1000 characters']
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowAnonymous: {
      type: Boolean,
      default: false
    },
    maxSessionsPerUser: {
      type: Number,
      default: 10
    },
    sessionTimeout: {
      type: Number,
      default: 3600
    },
    requireCompletion: {
      type: Boolean,
      default: true
    },
    allowRetakes: {
      type: Boolean,
      default: true
    },
    maxRetakes: {
      type: Number,
      default: 3
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    }
  },
  metadata: {
    version: {
      type: String,
      default: '1.0.0'
    },
    lastModified: {
      type: Date,
      default: Date.now
    },
    totalInteractions: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    avgSessionTime: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    lastDeployed: {
      type: Date
    },
    estimatedDuration: {
      type: Number,
      default: 0
    }
  },
  deployment: {
    isDeployed: {
      type: Boolean,
      default: false
    },
    deployedAt: {
      type: Date
    },
    deployedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'development'
    },
    deploymentUrl: {
      type: String
    },
    healthStatus: {
      type: String,
      enum: ['healthy', 'warning', 'error'],
      default: 'healthy'
    },
    lastHealthCheck: {
      type: Date
    }
  },
  aiConfig: {
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
    systemPrompt: {
      type: String,
      maxlength: [2000, 'System prompt cannot be more than 2000 characters']
    },
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiKey'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

TrainerSchema.virtual('flows', {
  ref: 'TrainerFlow',
  localField: '_id',
  foreignField: 'trainerId'
});

TrainerSchema.virtual('sessions', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'trainerId'
});

TrainerSchema.virtual('analytics', {
  ref: 'Analytics',
  localField: '_id',
  foreignField: 'trainerId'
});

TrainerSchema.virtual('testScenarios', {
  ref: 'TestScenario',
  localField: '_id',
  foreignField: 'trainerId'
});

TrainerSchema.virtual('deployments', {
  ref: 'Deployment',
  localField: '_id',
  foreignField: 'trainerId'
});

TrainerSchema.index({ createdBy: 1 });
TrainerSchema.index({ type: 1 });
TrainerSchema.index({ tags: 1 });
TrainerSchema.index({ 'deployment.isDeployed': 1 });

TrainerSchema.methods.isActive = function() {
  return this.status === 'active' && this.deployment.isDeployed;
};

TrainerSchema.methods.canBeAccessedBy = function(userId) {
  return this.assignedTo.includes(userId) || 
         this.createdBy.equals(userId) ||
         this.settings.isPublic;
};

TrainerSchema.methods.updateMetadata = function(sessionData) {
  this.metadata.totalSessions += 1;
  this.metadata.totalInteractions += sessionData.interactions || 0;
  
  if (sessionData.duration) {
    const currentAvg = this.metadata.avgSessionTime;
    const totalSessions = this.metadata.totalSessions;
    this.metadata.avgSessionTime = ((currentAvg * (totalSessions - 1)) + sessionData.duration) / totalSessions;
  }
  
  if (sessionData.completed) {
    const completedSessions = this.metadata.totalSessions;
    this.metadata.completionRate = (completedSessions / this.metadata.totalSessions) * 100;
  }
  
  this.metadata.lastModified = new Date();
};

TrainerSchema.methods.deploy = function(userId, environment = 'production') {
  this.deployment.isDeployed = true;
  this.deployment.deployedAt = new Date();
  this.deployment.deployedBy = userId;
  this.deployment.environment = environment;
  this.status = 'active';
  this.metadata.lastDeployed = new Date();
};

TrainerSchema.methods.undeploy = function() {
  this.deployment.isDeployed = false;
  this.deployment.deployedAt = null;
  this.deployment.deployedBy = null;
  this.status = 'inactive';
};

TrainerSchema.pre('remove', async function(next) {
  await this.model('TrainerFlow').deleteMany({ trainerId: this._id });
  await this.model('Session').deleteMany({ trainerId: this._id });
  await this.model('Analytics').deleteMany({ trainerId: this._id });
  await this.model('TestScenario').deleteMany({ trainerId: this._id });
  await this.model('Deployment').deleteMany({ trainerId: this._id });
  next();
});

module.exports = mongoose.model('Trainer', TrainerSchema);