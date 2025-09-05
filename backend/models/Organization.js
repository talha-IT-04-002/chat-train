const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add an organization name'],
    trim: true,
    maxlength: [100, 'Organization name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  logo: {
    type: String,
    default: ''
  },
  domain: {
    type: String,
    unique: true,
    sparse: true,
    match: [
      /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
      'Please add a valid domain'
    ]
  },
  settings: {
    maxUsers: {
      type: Number,
      default: 10
    },
    maxTrainers: {
      type: Number,
      default: 5
    },
    features: [{
      type: String,
      enum: [
        'basic-training',
        'advanced-analytics',
        'team-management',
        'api-access',
        'custom-branding',
        'advanced-testing',
        'deployment-management',
        'report-generation'
      ]
    }],
    branding: {
      primaryColor: {
        type: String,
        default: '#40B1DF'
      },
      logo: {
        type: String,
        default: ''
      },
      customCss: {
        type: String,
        default: ''
      }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'trial'],
      default: 'trial'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    trialEndsAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

OrganizationSchema.virtual('teamMembers', {
  ref: 'TeamMember',
  localField: '_id',
  foreignField: 'organizationId'
});

OrganizationSchema.virtual('trainers', {
  ref: 'Trainer',
  localField: '_id',
  foreignField: 'organizationId'
});

OrganizationSchema.virtual('analytics', {
  ref: 'Analytics',
  localField: '_id',
  foreignField: 'organizationId'
});

OrganizationSchema.index({ domain: 1 });
OrganizationSchema.index({ 'subscription.status': 1 });

OrganizationSchema.methods.hasActiveSubscription = function() {
  return this.subscription.status === 'active' || 
         (this.subscription.status === 'trial' && this.subscription.trialEndsAt > new Date());
};

OrganizationSchema.methods.canAddUser = function() {
  return this.hasActiveSubscription();
};

OrganizationSchema.methods.canAddTrainer = function() {
  return this.hasActiveSubscription();
};

OrganizationSchema.pre('remove', async function(next) {
  await this.model('TeamMember').deleteMany({ organizationId: this._id });
  await this.model('Trainer').deleteMany({ organizationId: this._id });
  await this.model('Analytics').deleteMany({ organizationId: this._id });
  await this.model('ApiKey').deleteMany({ organizationId: this._id });
  await this.model('Notification').deleteMany({ organizationId: this._id });
  await this.model('Report').deleteMany({ organizationId: this._id });
  next();
});

module.exports = mongoose.model('Organization', OrganizationSchema);