const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { calculateProfileScore } = require('../utils/profileScore');
const { sendVerificationOtpEmail } = require('../utils/emailService');

const OTP_EXPIRY_MINUTES = 10;

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const hashVerificationValue = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');

const generateVerificationOtp = () =>
  crypto.randomInt(100000, 1000000).toString();

const setVerificationOtp = (user, otp) => {
  user.verificationToken = hashVerificationValue(otp);
  user.verificationTokenExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
};

const clearVerificationState = (user) => {
  user.emailVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpiry = null;
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone, location, skills, category, lat, lng, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (skills && Array.isArray(skills) && skills.length > 2) {
      return res.status(400).json({ message: 'You can select a maximum of 2 skills.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationOtp = generateVerificationOtp();

    let locationCoords;
    if (lat != null && lng != null) {
      locationCoords = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
      };
    }

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || '',
      location: location || '',
      skills: skills || [],
      category: category || '',
      role: role || 'client',
      locationCoords,
      emailVerified: false,
    });

    setVerificationOtp(user, verificationOtp);
    user.completionScore = calculateProfileScore(user);
    await user.save();

    let otpSent = true;
    try {
      await sendVerificationOtpEmail(user.email, user.name, verificationOtp);
    } catch (emailErr) {
      otpSent = false;
      console.error('Verification OTP failed to send:', emailErr.message);
    }

    res.status(201).json({
      message: otpSent
        ? 'Registration successful. A verification code has been sent to your email.'
        : 'Registration successful, but we could not send the verification code. Please resend it.',
      requiresVerification: true,
      email: user.email,
      otpSent,
      otpExpiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    if (!user.emailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        requiresVerification: true,
        email: user.email,
      });
    }

    const userObj = user.toObject();
    delete userObj.password;
    userObj.token = generateToken(user._id);

    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is missing.' });
    }

    const hashedToken = hashVerificationValue(token);

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'This verification link is invalid or has expired. Please request a new OTP.',
        expired: true,
      });
    }

    clearVerificationState(user);
    await user.save();

    res.json({
      message: 'Email verified successfully! You can now log in.',
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    if (user.emailVerified) {
      return res.json({
        message: 'Email is already verified. You can log in now.',
        success: true,
        alreadyVerified: true,
      });
    }

    const hashedOtp = hashVerificationValue(otp);
    const isExpired =
      !user.verificationTokenExpiry || user.verificationTokenExpiry.getTime() <= Date.now();

    if (user.verificationToken !== hashedOtp || isExpired) {
      return res.status(400).json({
        message: 'This OTP is invalid or expired. Please request a new one.',
        expired: isExpired,
      });
    }

    clearVerificationState(user);
    await user.save();

    res.json({
      message: 'Email verified successfully! You can now log in.',
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resendVerification = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: 'If this email exists, a verification code has been sent.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'This account is already verified. Please log in.' });
    }

    const verificationOtp = generateVerificationOtp();
    setVerificationOtp(user, verificationOtp);
    await user.save();

    await sendVerificationOtpEmail(email, user.name, verificationOtp);

    res.json({
      message: 'Verification code sent. Please check your email.',
      otpExpiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  verifyEmail,
  verifyEmailOtp,
  resendVerification,
};
