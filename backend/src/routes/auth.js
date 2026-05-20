const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyEmail, verifyEmailOtp, resendVerification } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email-otp', verifyEmailOtp);
router.get('/me', protect, getMe);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

module.exports = router;
