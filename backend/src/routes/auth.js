const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyEmail, verifyEmailOtp, resendVerification, sendSignupOtp, verifySignupOtp, sendLoginOtp, verifyLoginOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email-otp', verifyEmailOtp);
// backwards-compatible aliases expected by clients
router.post('/verify-email', verifyEmailOtp);
// New OTP-based endpoints
router.post('/send-signup-otp', sendSignupOtp);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/send-login-otp', sendLoginOtp);
router.post('/verify-login-otp', verifyLoginOtp);
router.get('/me', protect, getMe);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/resend-otp', resendVerification);

module.exports = router;
