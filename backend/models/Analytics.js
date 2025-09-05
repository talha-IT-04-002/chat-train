const mongoose = require('mongoose');

const UserEngagementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionsCount: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  avgScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalInteractions: {
    type: Number,
    default: 0
  }
}, { _id: false });

const NodeAnalyticsSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true
  },
  visits: {
    type: Number,
    default: 0
  },
  completions: {
    type: Number,
    default: 0
  },
  avgTimeSpent: {
    type: Number,
    default: 0
  },
  errorRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  dropoffRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  avgScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, { _id: false });

const PerformanceSchema = new mongoose.Schema({
  avgResponseTime: {
    type: Number,
    default: 0
  },
  errorCount: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  uptime: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  }
}, { _id: false });

const AnalyticsSchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer'
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  metrics: {
    totalSessions: {
      type: Number,
      default: 0
    },
    activeSessions: {
      type: Number,
      default: 0
    },
    completedSessions: {
      type: Number,
      default: 0
    },
    abandonedSessions: {
      type: Number,
      default: 0
    },
    avgSessionDuration: {
      type: Number,
      default: 0
    },
    avgCompletionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalInteractions: {
      type: Number,
      default: 0
    },
    uniqueUsers: {
      type: Number,
      default: 0
    },
    newUsers: {
      type: Number,
      default: 0
    },
    returningUsers: {
      type: Number,
      default: 0
    },
    avgScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  userEngagement: [{
    type: UserEngagementSchema
  }],
  nodeAnalytics: [{
    type: NodeAnalyticsSchema
  }],
  performance: {
    type: PerformanceSchema,
    default: {}
  },
  trends: {
    sessionGrowth: {
      type: Number,
      default: 0
    },
    completionRateGrowth: {
      type: Number,
      default: 0
    },
    avgScoreGrowth: {
      type: Number,
      default: 0
    },
    userRetentionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  demographics: {
    deviceTypes: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 }
    },
    browsers: {
      chrome: { type: Number, default: 0 },
      firefox: { type: Number, default: 0 },
      safari: { type: Number, default: 0 },
      edge: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    locations: [{
      country: String,
      region: String,
      city: String,
      sessions: { type: Number, default: 0 }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

AnalyticsSchema.virtual('trainer', {
  ref: 'Trainer',
  localField: 'trainerId',
  foreignField: '_id',
  justOne: true
});

AnalyticsSchema.virtual('organization', {
  ref: 'Organization',
  localField: 'organizationId',
  foreignField: '_id',
  justOne: true
});

AnalyticsSchema.index({ organizationId: 1, date: -1 });
AnalyticsSchema.index({ trainerId: 1, date: -1 });
AnalyticsSchema.index({ date: -1 });
AnalyticsSchema.index({ period: 1 });

AnalyticsSchema.methods.updateFromSession = function(session) {
  this.metrics.totalSessions += 1;
  
  if (session.status === 'completed') {
    this.metrics.completedSessions += 1;
  } else if (session.status === 'abandoned') {
    this.metrics.abandonedSessions += 1;
  }
  
  this.metrics.totalInteractions += session.analytics.totalInteractions || 0;
  
  if (session.duration) {
    const currentTotal = this.metrics.avgSessionDuration * (this.metrics.totalSessions - 1);
    this.metrics.avgSessionDuration = Math.round((currentTotal + session.duration) / this.metrics.totalSessions);
  }
  
  if (this.metrics.totalSessions > 0) {
    this.metrics.avgCompletionRate = Math.round((this.metrics.completedSessions / this.metrics.totalSessions) * 100);
  }
  
  if (session.progress.score) {
    const currentTotal = this.metrics.avgScore * (this.metrics.totalSessions - 1);
    this.metrics.avgScore = Math.round((currentTotal + session.progress.score) / this.metrics.totalSessions);
  }
};

AnalyticsSchema.methods.updateUserEngagement = function(userId, sessionData) {
  let userEngagement = this.userEngagement.find(ue => ue.userId.equals(userId));
  
  if (!userEngagement) {
    userEngagement = {
      userId,
      sessionsCount: 0,
      totalDuration: 0,
      completionRate: 0,
      lastActivity: new Date(),
      avgScore: 0,
      totalInteractions: 0
    };
    this.userEngagement.push(userEngagement);
    this.metrics.uniqueUsers += 1;
  }
  
  userEngagement.sessionsCount += 1;
  userEngagement.totalDuration += sessionData.duration || 0;
  userEngagement.totalInteractions += sessionData.interactions || 0;
  userEngagement.lastActivity = new Date();
  
  if (sessionData.score) {
    const currentTotal = userEngagement.avgScore * (userEngagement.sessionsCount - 1);
    userEngagement.avgScore = Math.round((currentTotal + sessionData.score) / userEngagement.sessionsCount);
  }
  
  if (sessionData.completed) {
    const completedSessions = userEngagement.sessionsCount;
    userEngagement.completionRate = Math.round((completedSessions / userEngagement.sessionsCount) * 100);
  }
};

AnalyticsSchema.methods.updateNodeAnalytics = function(nodeId, nodeData) {
  let nodeAnalytics = this.nodeAnalytics.find(na => na.nodeId === nodeId);
  
  if (!nodeAnalytics) {
    nodeAnalytics = {
      nodeId,
      visits: 0,
      completions: 0,
      avgTimeSpent: 0,
      errorRate: 0,
      dropoffRate: 0,
      avgScore: 0
    };
    this.nodeAnalytics.push(nodeAnalytics);
  }
  
  nodeAnalytics.visits += 1;
  
  if (nodeData.completed) {
    nodeAnalytics.completions += 1;
  }
  
  if (nodeData.timeSpent) {
    const currentTotal = nodeAnalytics.avgTimeSpent * (nodeAnalytics.visits - 1);
    nodeAnalytics.avgTimeSpent = Math.round((currentTotal + nodeData.timeSpent) / nodeAnalytics.visits);
  }
  
  if (nodeData.score) {
    const currentTotal = nodeAnalytics.avgScore * (nodeAnalytics.visits - 1);
    nodeAnalytics.avgScore = Math.round((currentTotal + nodeData.score) / nodeAnalytics.visits);
  }
  
  if (nodeData.error) {
    nodeAnalytics.errorRate = Math.round((nodeAnalytics.errorCount / nodeAnalytics.visits) * 100);
  }
};

AnalyticsSchema.methods.calculateTrends = function(previousAnalytics) {
  if (!previousAnalytics) return;
  
  if (previousAnalytics.metrics.totalSessions > 0) {
    this.trends.sessionGrowth = Math.round(
      ((this.metrics.totalSessions - previousAnalytics.metrics.totalSessions) / 
       previousAnalytics.metrics.totalSessions) * 100
    );
  }
  
  if (previousAnalytics.metrics.avgCompletionRate > 0) {
    this.trends.completionRateGrowth = Math.round(
      ((this.metrics.avgCompletionRate - previousAnalytics.metrics.avgCompletionRate) / 
       previousAnalytics.metrics.avgCompletionRate) * 100
    );
  }
  
  if (previousAnalytics.metrics.avgScore > 0) {
    this.trends.avgScoreGrowth = Math.round(
      ((this.metrics.avgScore - previousAnalytics.metrics.avgScore) / 
       previousAnalytics.metrics.avgScore) * 100
    );
  }
};

AnalyticsSchema.statics.getSummary = function(organizationId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        organizationId: mongoose.Types.ObjectId(organizationId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: '$metrics.totalSessions' },
        completedSessions: { $sum: '$metrics.completedSessions' },
        totalInteractions: { $sum: '$metrics.totalInteractions' },
        uniqueUsers: { $max: '$metrics.uniqueUsers' },
        avgCompletionRate: { $avg: '$metrics.avgCompletionRate' },
        avgScore: { $avg: '$metrics.avgScore' },
        avgSessionDuration: { $avg: '$metrics.avgSessionDuration' }
      }
    }
  ]);
};

AnalyticsSchema.statics.getTrends = function(organizationId, days = 30) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        organizationId: mongoose.Types.ObjectId(organizationId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $sort: { date: 1 }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' }
        },
        totalSessions: { $sum: '$metrics.totalSessions' },
        completedSessions: { $sum: '$metrics.completedSessions' },
        avgCompletionRate: { $avg: '$metrics.avgCompletionRate' },
        avgScore: { $avg: '$metrics.avgScore' }
      }
    }
  ]);
};

module.exports = mongoose.model('Analytics', AnalyticsSchema);