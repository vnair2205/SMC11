// server/models/StudyGroup.js
const mongoose = require('mongoose');

const StudyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  description: { // NEW: Add group description
    type: String,
    trim: true,
  },
  groupIcon: { // NEW: Add group icon URL
    type: String,
    default: 'https://i.imgur.com/6b6psnA.png' // A default placeholder icon
  },
  isGroupChat: {
    type: Boolean,
    default: false,
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('StudyGroup', StudyGroupSchema);