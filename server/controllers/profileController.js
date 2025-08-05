// server/controllers/profileController.js
const User = require('../models/User');

// Get user profile (excluding sensitive info)
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -phoneOtp -phoneOtpExpires');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    // We'll pull all possible fields from the request body
    const {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        billingAddress,
        about,
        socialMedia,
        learningGoals,
        resourceNeeds,
        experienceLevel,
        newSkillsTarget,
        areasOfInterest
    } = req.body;

    const profileFields = {};
    if (firstName) profileFields.firstName = firstName;
    if (lastName) profileFields.lastName = lastName;
    if (email) profileFields.email = email;
    if (phone) profileFields.phone = phone;
    if (dateOfBirth) profileFields.dateOfBirth = dateOfBirth;
    if (billingAddress) profileFields.billingAddress = billingAddress;
    if (about) profileFields.about = about;
    if (socialMedia) profileFields.socialMedia = socialMedia;
    if (learningGoals) profileFields.learningGoals = learningGoals;
    if (resourceNeeds) profileFields.resourceNeeds = resourceNeeds;
    if (experienceLevel) profileFields.experienceLevel = experienceLevel;
    if (newSkillsTarget) profileFields.newSkillsTarget = newSkillsTarget;
    if (areasOfInterest) profileFields.areasOfInterest = areasOfInterest;
    
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true }
        ).select('-password -phoneOtp -phoneOtpExpires');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getProfile, updateProfile };