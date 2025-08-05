// server/routes/studyGroup.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
    searchUsers, // Import the new search function
    accessOrCreateChat,
    fetchUserGroups,
    createGroupChat,
    renameGroup,
    addUserToGroup,
    removeUserFromGroup
} = require('../controllers/studyGroupController');

// New route to search for users
router.route('/users').get(auth, searchUsers);

// Routes for chat and group management
router.route('/').post(auth, accessOrCreateChat);
router.route('/').get(auth, fetchUserGroups);
router.route('/group').post(auth, createGroupChat);
router.route('/rename').put(auth, renameGroup);
router.route('/groupadd').put(auth, addUserToGroup);
router.route('/groupremove').put(auth, removeUserFromGroup);

module.exports = router;