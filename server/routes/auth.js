// server/routes/auth.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    registerUser,
    loginUser,
    forceLoginUser,
    logoutUser,
    verifyPhoneOtp,
    verifyEmailOtp,
    checkEmailExists,
    checkPhoneExists,
    resendPhoneOtp,
    updateAndResendPhoneOtp,
    resendEmailOtp,
    updateAndResendEmailOtp,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

console.log('auth middleware type:', typeof auth);
console.log('registerUser type:', typeof registerUser);
console.log('loginUser type:', typeof loginUser);
console.log('forceLoginUser type:', typeof forceLoginUser);
console.log('logoutUser type:', typeof logoutUser);
console.log('verifyPhoneOtp type:', typeof verifyPhoneOtp);
console.log('verifyEmailOtp type:', typeof verifyEmailOtp);
console.log('checkEmailExists type:', typeof checkEmailExists);
console.log('checkPhoneExists type:', typeof checkPhoneExists);
console.log('resendPhoneOtp type:', typeof resendPhoneOtp);
console.log('updateAndResendPhoneOtp type:', typeof updateAndResendPhoneOtp);
console.log('resendEmailOtp type:', typeof resendEmailOtp);
console.log('updateAndResendEmailOtp type:', typeof updateAndResendEmailOtp);
console.log('forgotPassword type:', typeof forgotPassword);
console.log('resetPassword type:', typeof resetPassword);


router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/force-login', forceLoginUser);
router.post('/logout', auth, logoutUser);
router.post('/verify-phone', verifyPhoneOtp);
router.post('/verify-email', verifyEmailOtp);
router.post('/resend-phone-otp', resendPhoneOtp);
router.post('/update-phone', updateAndResendPhoneOtp);
router.post('/resend-email-otp', resendEmailOtp);
router.post('/update-email', updateAndResendEmailOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/check-email', checkEmailExists);
router.post('/check-phone', checkPhoneExists);

console.log('Type of router before export in auth.js:', typeof router);

module.exports = router;