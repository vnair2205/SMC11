// server/routes/message.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { allMessages } = require('../controllers/messageController');

// Route to get all messages for a specific chat
router.route('/:chatId').get(auth, allMessages);

module.exports = router;