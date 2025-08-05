// server/controllers/studyGroupController.js
const StudyGroup = require('../models/StudyGroup');
const User = require('../models/User');
const Message = require('../models/Message');

/**
 * @desc    Search for users to add to a chat
 * @route   GET /api/studygroup/users?search=...
 * @access  Private
 */
const searchUsers = async (req, res) => {
    const keyword = req.query.search
        ? {
              $or: [
                  { firstName: { $regex: req.query.search, $options: 'i' } },
                  { lastName: { $regex: req.query.search, $options: 'i' } },
                  { email: { $regex: req.query.search, $options: 'i' } },
              ],
          }
        : {};

    try {
        const users = await User.find(keyword)
            .find({ _id: { $ne: req.user.id } }) // Exclude the current user
            .select('firstName lastName email'); // Select only necessary fields
        res.send(users);
    } catch (error) {
        res.status(500).json({ msg: 'Server error while searching users' });
    }
};

/**
 * @desc    Create or fetch a 1-on-1 chat with another user
 * @route   POST /api/studygroup/
 * @access  Private
 */
const accessOrCreateChat = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).send({ message: 'UserId param not sent with request' });
    }

    try {
        let isChat = await StudyGroup.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user.id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],
        })
        .populate('users', '-password')
        .populate('latestMessage');

        isChat = await User.populate(isChat, {
            path: 'latestMessage.sender',
            select: 'firstName lastName email',
        });

        if (isChat.length > 0) {
            res.send(isChat[0]);
        } else {
            const chatData = {
                name: 'sender', // Placeholder name
                isGroupChat: false,
                users: [req.user.id, userId],
            };
            const createdChat = await StudyGroup.create(chatData);
            const fullChat = await StudyGroup.findOne({ _id: createdChat._id }).populate('users', '-password');
            res.status(200).json(fullChat);
        }
    } catch (error) {
        res.status(500).json({ msg: 'Server error while accessing chat' });
    }
};

/**
 * @desc    Fetch all chats and groups for the logged-in user
 * @route   GET /api/studygroup/
 * @access  Private
 */
const fetchUserGroups = async (req, res) => {
    try {
        StudyGroup.find({ users: { $elemMatch: { $eq: req.user.id } } })
            .populate('users', '-password')
            .populate('groupAdmin', '-password')
            .populate('latestMessage')
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: 'latestMessage.sender',
                    select: 'firstName lastName email',
                });
                res.status(200).send(results);
            });
    } catch (error) {
        res.status(500).json({ msg: 'Server error while fetching groups' });
    }
};

/**
 * @desc    Create a new group chat
 * @route   POST /api/studygroup/group
 * @access  Private
 */
const createGroupChat = async (req, res) => {
    if (!req.body.users || !req.body.name || !req.body.description) {
        return res.status(400).send({ message: 'Please fill all the fields' });
    }

    let users = JSON.parse(req.body.users);

    // --- THIS IS THE FIX ---
    // Change the check from 2 to 1, to allow groups with 2 total members (creator + 1)
    if (users.length < 1) {
        return res.status(400).send('At least one other user must be selected to form a group.');
    }

    users.push(req.user); // Add the current user (creator) to the group

    try {
        const groupChat = await StudyGroup.create({
            name: req.body.name,
            description: req.body.description,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,
        });

        const fullGroupChat = await StudyGroup.findOne({ _id: groupChat._id })
            .populate('users', '-password')
            .populate('groupAdmin', '-password');

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(500).json({ msg: 'Server error while creating group chat' });
    }
};

// --- Placeholder functions for future features ---

const renameGroup = async (req, res) => {
  res.status(501).send('Functionality not yet implemented.');
};

const addUserToGroup = async (req, res) => {
  res.status(501).send('Functionality not yet implemented.');
};

const removeUserFromGroup = async (req, res) => {
  res.status(501).send('Functionality not yet implemented.');
};


module.exports = {
    searchUsers,
    accessOrCreateChat,
    fetchUserGroups,
    createGroupChat,
    renameGroup,
    addUserToGroup,
    removeUserFromGroup
};