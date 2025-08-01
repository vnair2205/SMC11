const mongoose = require('mongoose');

// Sub-document for the active session
const SessionSchema = new mongoose.Schema({
    token: { type: String, required: true },
    ipAddress: { type: String },
    location: { type: String },
    device: { type: String },
    loggedInAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,

  },
  dateOfBirth: {
    type: Date,
  },
  password: {
    type: String,
    required: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  emailOtp: { type: String },
  emailOtpExpires: { type: Date },
  
  // Fields for password reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // Field to store the single active session
  activeSession: SessionSchema

}, {
  timestamps: true, // Adds createdAt and updatedAt fields automatically
});

module.exports = mongoose.model('User', UserSchema);