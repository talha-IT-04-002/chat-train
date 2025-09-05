const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'manager', 'trainer', 'viewer'],
    default: 'viewer'
  },
  permissions: [{
    type: String,
    enum: [
      'create_trainer',
      'edit_trainer',
      'delete_trainer',
      'view_analytics',
      'manage_team',
      'manage_api_keys',
      'deploy_trainer',
      'run_tests',
      'generate_reports',
      'manage_settings'
    ]
  }],
  status: {
    type: String,
    enum: ['active', 'invited', 'suspended', 'pending'],
    default: 'pending'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  joinedAt: {
    type: Date
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  assignedTrainers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer'
  }],
  inviteToken: {
    type: String
  },
  inviteExpires: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

TeamMemberSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

TeamMemberSchema.virtual('organization', {
  ref: 'Organization',
  localField: 'organizationId',
  foreignField: '_id',
  justOne: true
});

TeamMemberSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

TeamMemberSchema.index({ organizationId: 1, status: 1 });
TeamMemberSchema.index({ role: 1 });
TeamMemberSchema.index({ invitedBy: 1 });

TeamMemberSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || 
         this.role === 'owner' || 
         this.role === 'admin';
};

TeamMemberSchema.methods.canManageMembers = function() {
  return ['owner', 'admin', 'manager'].includes(this.role);
};

TeamMemberSchema.methods.canManageTrainers = function() {
  return this.hasPermission('create_trainer') || 
         this.hasPermission('edit_trainer') || 
         this.hasPermission('delete_trainer');
};

TeamMemberSchema.methods.canViewAnalytics = function() {
  return this.hasPermission('view_analytics') || 
         ['owner', 'admin', 'manager'].includes(this.role);
};

TeamMemberSchema.methods.generateInviteToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.inviteToken = crypto.createHash('sha256').update(token).digest('hex');
  this.inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return token;
};

TeamMemberSchema.methods.verifyInviteToken = function(token) {
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.inviteToken === hashedToken && this.inviteExpires > new Date();
};

TeamMemberSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    this.permissions = [];
    
    switch (this.role) {
      case 'owner':
        this.permissions = [
          'create_trainer', 'edit_trainer', 'delete_trainer', 'view_analytics',
          'manage_team', 'manage_api_keys', 'deploy_trainer', 'run_tests',
          'generate_reports', 'manage_settings'
        ];
        break;
      case 'admin':
        this.permissions = [
          'create_trainer', 'edit_trainer', 'delete_trainer', 'view_analytics',
          'manage_team', 'manage_api_keys', 'deploy_trainer', 'run_tests',
          'generate_reports', 'manage_settings'
        ];
        break;
      case 'manager':
        this.permissions = [
          'create_trainer', 'edit_trainer', 'view_analytics',
          'manage_team', 'deploy_trainer', 'run_tests', 'generate_reports'
        ];
        break;
      case 'trainer':
        this.permissions = [
          'create_trainer', 'edit_trainer', 'view_analytics',
          'run_tests'
        ];
        break;
      case 'viewer':
        this.permissions = ['view_analytics'];
        break;
    }
  }
  next();
});

module.exports = mongoose.model('TeamMember', TeamMemberSchema);