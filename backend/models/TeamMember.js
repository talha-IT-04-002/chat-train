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
TeamMemberSchema.index({ invitedBy: 1 });


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


module.exports = mongoose.model('TeamMember', TeamMemberSchema);