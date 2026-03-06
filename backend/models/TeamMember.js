const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    role: {
      type: String,
      enum: ['Team Leader', 'Member'],
      default: 'Member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate team membership
teamMemberSchema.index({ team: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
