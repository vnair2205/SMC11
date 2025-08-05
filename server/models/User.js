// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    isPhoneVerified: { type: Boolean, default: false },
    phoneOtp: { type: String },
    phoneOtpExpires: { type: Date },
    date: { type: Date, default: Date.now },

    // --- THIS IS THE FIX: Add the missing session token field ---
    activeSessionToken: {
        type: String,
    },

    // --- Profile Fields ---
    profilePicture: { 
        type: String, 
        default: 'https://i.imgur.com/6b6psnA.png'
    },
    dateOfBirth: { type: Date },
    billingAddress: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zipCode: { type: String, default: '' },
        country: { type: String, default: '' },
    },
    
    // BIO Section
    about: { type: String, default: '' },
    socialMedia: {
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
        youtube: { type: String, default: '' },
        twitter: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        reddit: { type: String, default: '' },
    },

    // LEARNS Profile Section
    learningGoals: { type: [String], default: [] },
    resourceNeeds: { type: [String], default: [] },
    experienceLevel: { type: String, default: 'Beginner' },
    newSkillsTarget: { type: [String], default: [] },
    areasOfInterest: { type: [String], default: [] },
});

module.exports = mongoose.model('User', UserSchema);