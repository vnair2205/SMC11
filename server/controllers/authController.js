// server/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const useragent = require('useragent');
const geoip = require('geoip-lite');

const getSessionDetails = (req) => {
    const agent = useragent.parse(req.headers['user-agent']);
    const ip = req.ip === '::1' ? '127.0.0.1' : (req.ip || req.connection.remoteAddress);
    const geo = geoip.lookup(ip);
    const location = (ip === '127.0.0.1') ? 'Localhost' : (geo ? `${geo.city}, ${geo.region}, ${geo.country}` : 'Unknown Location');
    return { ipAddress: ip, device: `${agent.toAgent()} on ${agent.os.toString()}`, location };
};

// NEW HELPER FUNCTION: To generate and send email OTP
const generateAndSendEmailOtp = async (user) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    user.emailOtp = otp;
    user.emailOtpExpires = Date.now() + 3600000; // OTP valid for 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            ciphers: 'SSLv3'
        }
    });

    const mailOptions = {
        to: user.email,
        from: process.env.SMTP_USER,
        subject: 'SeekMYCOURSE Email Verification OTP',
        html: `Your OTP for email verification is: <b>${otp}</b>. It is valid for 1 hour.`
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email OTP] Sent OTP to ${user.email}`);
};


exports.registerUser = async (req, res) => {
    const { firstName, lastName, email, password, phoneNumber } = req.body;
    try {
        let userByEmail = await User.findOne({ email });
        if (userByEmail) return res.status(400).json({ msgKey: 'errors.email_exists' });
        
        let userByPhone = await User.findOne({ phoneNumber });
        if (userByPhone) return res.status(400).json({ msgKey: 'errors.phone_exists' });

        const user = new User({ firstName, lastName, email, password, phoneNumber });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verifications.create({ to: phoneNumber, channel: 'sms' });
        
        res.status(201).json({ msg: 'Registration successful. Please verify your phone number.', email: user.email, phone: user.phoneNumber });
    } catch (err) {
        console.error('Registration Error:', err);
        if (err.code === 21614) { // Twilio error code for invalid phone number
            return res.status(400).json({ msgKey: 'errors.phone_invalid', context: { phoneNumber: err.message.match(/\+?\d{10,15}/)?.[0] || 'provided number' } });
        } else if (err.code === 21612) { // Twilio error code for fraudulent phone number
            const fraudulentPhoneNumber = err.message.match(/\+?\d{10,15}/)?.[0];
            return res.status(400).json({ msgKey: 'errors.phone_fraudulent', context: { phoneNumber: fraudulentPhoneNumber } });
        }
        res.status(500).json({ msgKey: 'errors.generic' });
    }
};

exports.verifyPhoneOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msgKey: 'errors.user_not_found' });
        
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const verification_check = await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verificationChecks.create({ to: user.phoneNumber, code: otp });
        
        if (verification_check.status !== 'approved') {
            return res.status(400).json({ msgKey: 'errors.otp_invalid_or_expired' });
        }
        
        user.isPhoneVerified = true; 
        await user.save();
        
        // Call the new helper function to generate and send email OTP
        await generateAndSendEmailOtp(user);

        res.status(200).json({ msg: 'Phone number verified. Proceeding to email verification.', email: user.email });
    } catch (err) {
        console.error('Phone Verification Error:', err);
        res.status(500).json({ msgKey: 'errors.generic' });
    }
};

exports.verifyEmailOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msgKey: 'errors.user_not_found' });
        
        // Actual verification logic
        if (user.emailOtp !== otp || user.emailOtpExpires < Date.now()) {
            return res.status(400).json({ msgKey: 'errors.otp_invalid_or_expired' });
        }
        
        user.isEmailVerified = true; 
        user.emailOtp = undefined; // Clear OTP after successful verification
        user.emailOtpExpires = undefined; // Clear OTP expiry
        await user.save();

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
        user.activeSession = { token, ...getSessionDetails(req) };
        await user.save();
        res.status(200).json({ msg: 'Email verified! Registration complete.', token });
    } catch (err) {
        console.error('Email Verification Error:', err);
        res.status(500).json({ msgKey: 'errors.generic' });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msgKey: 'errors.invalid_credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msgKey: 'errors.invalid_credentials' });

        // Check for active session conflict
        // FIX: Add a check to ensure user.activeSession exists before accessing its properties
        if (user.activeSession) {
            try {
                jwt.verify(user.activeSession.token, process.env.JWT_SECRET);
                return res.status(409).json({
                    msgKey: 'errors.session_conflict',
                    activeSession: user.activeSession
                });
            } catch (jwtError) {
                user.activeSession = undefined;
                await user.save();
                console.log('[Login] Expired/Invalid session token found and cleared.');
            }
        }

        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
        user.activeSession = { token, ...getSessionDetails(req) };
        await user.save();
        
        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msgKey: 'errors.generic' });
    }
};

exports.forceLoginUser = async (req, res) => {
    const { email, password } = req.body; // Assuming email/password are sent for re-auth
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msgKey: 'errors.invalid_credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msgKey: 'errors.invalid_credentials' });

        // Clear any existing session and create a new one
        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
        user.activeSession = { token, ...getSessionDetails(req) };
        await user.save();

        res.json({ token });
    } catch (err) {
        console.error('Force Login Error:', err.message);
        res.status(500).json({ msgKey: 'errors.generic' });
    }
};

exports.logoutUser = async (req, res) => {
    try {
        // req.user is populated by the auth middleware
        if (!req.user) {
            return res.status(401).json({ msg: 'User not authenticated for logout.' });
        }
        const user = await User.findById(req.user.id);
        if (user) {
            user.activeSession = undefined; // Clear the active session
            await user.save();
        }
        res.status(200).json({ msg: 'Logged out successfully.' });
    } catch (err) {
        console.error('Logout Error:', err);
        res.status(500).json({ msgKey: 'errors.generic' });
    }
};

exports.checkEmailExists = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        res.json({ exists: !!user });
    } catch (err) {
        console.error('Error checking email existence:', err);
        res.status(500).json({ msgKey: 'errors.generic' });
    }
};

exports.checkPhoneExists = async (req, res) => {
    const { phoneNumber } = req.body;
    try {
        const user = await User.findOne({ phoneNumber });
        res.json({ exists: !!user });
    } catch (err) {
        console.error('Error checking phone existence:', err);
        res.status(500).json({ msgKey: 'errors.generic' });
    }
};

exports.resendPhoneOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msgKey: 'errors.user_not_found' });

        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verifications.create({ to: user.phoneNumber, channel: 'sms' });

        res.status(200).json({ msg: 'phone_otp_resent_success' });
    } catch (err) {
        console.error('Resend Phone OTP Error:', err);
        if (err.code === 21614) {
            return res.status(400).json({ msgKey: 'errors.phone_invalid', context: { phoneNumber: err.message.match(/\+?\d{10,15}/)?.[0] || 'provided number' } });
        } else if (err.code === 21612) {
            const fraudulentPhoneNumber = err.message.match(/\+?\d{10,15}/)?.[0];
            return res.status(400).json({ msgKey: 'errors.phone_fraudulent', context: { phoneNumber: fraudulentPhoneNumber } });
        }
        res.status(500).json({ msgKey: 'errors.otp_failed_resend' });
    }
};

exports.updateAndResendPhoneOtp = async (req, res) => {
    const { email, newPhoneNumber } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msgKey: 'errors.user_not_found' });

        const existingUserWithNewPhone = await User.findOne({ phoneNumber: newPhoneNumber });
        if (existingUserWithNewPhone && existingUserWithNewPhone._id.toString() !== user._id.toString()) { // Check ID to allow update if it's the same user
            return res.status(400).json({ msgKey: 'errors.phone_exists' });
        }

        user.phoneNumber = newPhoneNumber;
        user.isPhoneVerified = false; // Reset verification status for the new number
        await user.save();

        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await twilioClient.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verifications.create({ to: newPhoneNumber, channel: 'sms' });

        res.status(200).json({ msg: 'phone_update_success' });
    } catch (err) {
        console.error('Update Phone Number Error:', err);
        if (err.code === 21614) {
            return res.status(400).json({ msgKey: 'errors.phone_invalid', context: { phoneNumber: err.message.match(/\+?\d{10,15}/)?.[0] || 'provided number' } });
        } else if (err.code === 21612) {
            const fraudulentPhoneNumber = err.message.match(/\+?\d{10,15}/)?.[0];
            return res.status(400).json({ msgKey: 'errors.phone_fraudulent', context: { phoneNumber: fraudulentPhoneNumber } });
        }
        res.status(500).json({ msgKey: 'errors.phone_update_failed' });
    }
};

exports.resendEmailOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msgKey: 'errors.user_not_found' });

        // Generate and send a new OTP to the user's current email
        await generateAndSendEmailOtp(user);
        res.status(200).json({ msg: 'email_otp_resent_success' });
    } catch (err) {
        console.error('Resend Email OTP Error:', err);
        res.status(500).json({ msgKey: 'errors.otp_failed_resend' });
    }
};

exports.updateAndResendEmailOtp = async (req, res) => {
    const { oldEmail, newEmail } = req.body;
    try {
        const user = await User.findOne({ email: oldEmail });
        if (!user) return res.status(404).json({ msgKey: 'errors.user_not_found' });

        const existingUserWithNewEmail = await User.findOne({ email: newEmail });
        if (existingUserWithNewEmail && existingUserWithNewEmail._id.toString() !== user._id.toString()) {
            return res.status(400).json({ msgKey: 'errors.email_exists' });
        }

        user.email = newEmail;
        user.isEmailVerified = false; // Reset verification status for the new email
        await user.save();

        // Generate and send a new OTP to the new email
        await generateAndSendEmailOtp(user);
        res.status(200).json({ msg: 'email_update_success' });
    } catch (err) {
        console.error('Update Email Error:', err);
        res.status(500).json({ msgKey: 'errors.email_update_failed' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msgKey: 'errors.email_not_registered' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetPasswordExpires;
        await user.save();

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                ciphers: 'SSLv3'
            }
        });

        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

        const mailOptions = {
            to: user.email,
            from: process.env.SMTP_USER,
            subject: 'SeekMYCOURSE Password Reset',
            html: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
            Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n
            <a href="${resetUrl}">${resetUrl}</a>\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ msg: 'reset_link_sent' });
    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ msgKey: 'errors.generic' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msgKey: 'errors.password_reset_invalid' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ msg: 'password_updated_success' });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ msgKey: 'errors.generic' });
    }
};