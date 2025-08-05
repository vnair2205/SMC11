// server/models/Chat.js
const mongoose = require('mongoose');

// Schema for an individual message
const MessageSchema = new mongoose.Schema({
    text: { 
        type: String, 
        required: true 
    },
    isUser: { 
        type: Boolean, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

// Schema for the entire chat conversation for a course
const ChatSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    course: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    messages: [MessageSchema]
}, { timestamps: true });

// Create a compound index to quickly find chats by user and course
ChatSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Chat', ChatSchema);