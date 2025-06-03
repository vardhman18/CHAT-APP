const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['direct', 'group', 'channel'],
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: ''
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    slowMode: {
      type: Number,  // Seconds between messages
      default: 0
    },
    whoCanSendMessages: {
      type: String,
      enum: ['all', 'admins', 'moderators'],
      default: 'all'
    }
  }
}, {
  timestamps: true
});

// Add text index for search functionality
roomSchema.index({ name: 'text', description: 'text' });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room; 