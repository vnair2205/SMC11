// server/controllers/messageController.js
const Message = require('../models/Message');
const User = require('../models/User');
const StudyGroup = require('../models/StudyGroup');

/**
 * @desc    Get all messages for a specific chat
 * @route   GET /api/message/:chatId
 * @access  Private
 */
const allMessages = async (req, res) => {
    try {
        const messages = await Message.find({ studyGroup: req.params.chatId })
            .populate('sender', 'firstName lastName email')
            .populate('studyGroup');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error: Could not fetch messages' });
    }
};

module.exports = { allMessages };