const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { calculateProfileScore } = require('../utils/profileScore');
const { sendVerificationOtpEmail } = require('../utils/emailService');
const Otp = require('../models/Otp');

const OTP_EXPIRY_MINUTES = 5; // 5 minute expiry as required
const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '30', 10);
const MAX_OTP_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS || '5', 10);

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const hashVerificationValue = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');

const generateVerificationOtp = () =>
  crypto.randomInt(100000, 1000000).toString();

const setVerificationOtp = (user, otp) => {
  user.verificationToken = hashVerificationValue(otp);
  user.verificationTokenExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  // also store otp-specific fields for clarity and compatibility
  user.otp = hashVerificationValue(otp);
  user.otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.lastOtpSentAt = new Date();
};

const clearVerificationState = (user) => {
  user.emailVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpiry = null;
  user.otp = null;
  user.otpExpires = null;
  user.lastOtpSentAt = null;
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

    // Existing register flow remains for compatibility but note: new recommended flow is
    // to use send-signup-otp -> verify-signup-otp -> register sequence. Keep backward compatibility.
    let otpSent = true;
    try {
      await sendVerificationOtpEmail(user.email, user.name, verificationOtp);
    } catch (emailErr) {
      otpSent = false;
      console.error('Verification OTP failed to send:', emailErr && emailErr.stack ? emailErr.stack : emailErr);
    }

    const responsePayload = {
      message: otpSent
        ? 'Registration successful. A verification code has been sent to your email.'
        : 'Registration successful, but we could not send the verification code. Please resend it.',
      requiresVerification: true,
      email: user.email,
      otpSent,
      otpExpiresInMinutes: OTP_EXPIRY_MINUTES,
    };

    if (process.env.NODE_ENV !== 'production') responsePayload.devOtp = verificationOtp;

    res.status(201).json(responsePayload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// New: send signup OTP without creating user account (stores payload in Otp doc)
const sendSignupOtp = async (req, res) => {
  try {
    const { name, email, password, phone, location, skills, category, lat, lng, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !password || !name) return res.status(400).json({ message: 'Name, email and password are required.' });

    // basic validations
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) return res.status(400).json({ message: 'Invalid email format.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters long.' });

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Account already exists with this email.' });

    // check cooldown for existing OTP
    const recent = await Otp.findOne({ email: normalizedEmail, purpose: 'signup' }).sort({ createdAt: -1 });
    if (recent && recent.lastSentAt) {
      const secondsSince = (Date.now() - new Date(recent.lastSentAt).getTime()) / 1000;
      if (secondsSince < OTP_RESEND_COOLDOWN_SECONDS) {
        return res.status(429).json({ message: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSince)} seconds before requesting another code.` });
      }
    }

    const otp = generateVerificationOtp();
    const otpHash = hashVerificationValue(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // store hashed password in payload
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const payload = { name, email: normalizedEmail, passwordHash, phone: phone || '', location: location || '', skills: skills || [], category: category || '', role: role || 'client', lat, lng };

    const otpDoc = new Otp({ email: normalizedEmail, otpHash, purpose: 'signup', expiresAt, verified: false, attempts: 0, lastSentAt: new Date(), payload });
    await otpDoc.save();

    try {
      await sendVerificationOtpEmail(normalizedEmail, name, otp);
    } catch (err) {
      console.error('sendSignupOtp email error:', err && err.stack ? err.stack : err);
      // do not reveal OTP; inform user to retry
      return res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
    }

    res.json({ message: 'Verification code sent. Please check your email.', otpExpiresInMinutes: OTP_EXPIRY_MINUTES });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// New: verify signup otp and create user
const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const otpDoc = await Otp.findOne({ email: normalizedEmail, purpose: 'signup', verified: false }).sort({ createdAt: -1 });
    if (!otpDoc) return res.status(400).json({ message: 'No signup OTP found for this email. Please request a new code.' });

    if (otpDoc.expiresAt.getTime() <= Date.now()) return res.status(400).json({ message: 'This OTP has expired. Please request a new code.' });
    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) return res.status(429).json({ message: 'Maximum verification attempts exceeded. Please request a new code.' });

    const hashed = hashVerificationValue(otp);
    if (hashed !== otpDoc.otpHash) {
      otpDoc.attempts = (otpDoc.attempts || 0) + 1;
      await otpDoc.save();
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // create user from payload
    const payload = otpDoc.payload || {};
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Account already exists with this email.' });

    const user = new User({
      name: payload.name || '',
      email: normalizedEmail,
      password: payload.passwordHash,
      phone: payload.phone || '',
      location: payload.location || '',
      skills: payload.skills || [],
      category: payload.category || '',
      role: payload.role || 'client',
      locationCoords: payload.lat != null && payload.lng != null ? { type: 'Point', coordinates: [parseFloat(payload.lng), parseFloat(payload.lat)] } : undefined,
      emailVerified: true,
    });

    user.completionScore = calculateProfileScore(user);
    await user.save();

    otpDoc.verified = true;
    await otpDoc.save();

    const userObj = user.toObject();
    delete userObj.password;
    userObj.token = generateToken(user._id);

    res.json({ message: 'Signup verified and account created.', user: userObj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// New: send login OTP
const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: 'No account found with this email.' });

    const recent = await Otp.findOne({ email: normalizedEmail, purpose: 'login' }).sort({ createdAt: -1 });
    if (recent && recent.lastSentAt) {
      const secondsSince = (Date.now() - new Date(recent.lastSentAt).getTime()) / 1000;
      if (secondsSince < OTP_RESEND_COOLDOWN_SECONDS) {
        return res.status(429).json({ message: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSince)} seconds before requesting another code.` });
      }
    }

    const otp = generateVerificationOtp();
    const otpHash = hashVerificationValue(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const otpDoc = new Otp({ email: normalizedEmail, otpHash, purpose: 'login', expiresAt, lastSentAt: new Date(), attempts: 0 });
    await otpDoc.save();

    try {
      await sendVerificationOtpEmail(normalizedEmail, user.name || '', otp);
    } catch (err) {
      console.error('sendLoginOtp email error:', err && err.stack ? err.stack : err);
      return res.status(500).json({ message: 'Failed to send OTP. Please try again later.' });
    }

    res.json({ message: 'Login OTP sent. Check your email.', otpExpiresInMinutes: OTP_EXPIRY_MINUTES });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// New: verify login otp and return token
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const otpDoc = await Otp.findOne({ email: normalizedEmail, purpose: 'login', verified: false }).sort({ createdAt: -1 });
    if (!otpDoc) return res.status(400).json({ message: 'No login OTP found for this email. Please request a new code.' });
    if (otpDoc.expiresAt.getTime() <= Date.now()) return res.status(400).json({ message: 'This OTP has expired. Please request a new code.' });
    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) return res.status(429).json({ message: 'Maximum verification attempts exceeded. Please request a new code.' });

    const hashed = hashVerificationValue(otp);
    if (hashed !== otpDoc.otpHash) {
      otpDoc.attempts = (otpDoc.attempts || 0) + 1;
      await otpDoc.save();
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    otpDoc.verified = true;
    await otpDoc.save();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: 'No account found with this email.' });

    const userObj = user.toObject();
    delete userObj.password;
    userObj.token = generateToken(user._id);

    res.json({ message: 'Login successful.', user: userObj });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    // prefer otp fields if present, otherwise fall back to verificationToken
    const tokenToCompare = user.otp || user.verificationToken;
    const expiryTime = (user.otpExpires && user.otpExpires.getTime()) || (user.verificationTokenExpiry && user.verificationTokenExpiry.getTime());
    const isExpired = !expiryTime || expiryTime <= Date.now();

    if (tokenToCompare !== hashedOtp || isExpired) {
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

    // rate limit resends
    if (user.lastOtpSentAt) {
      const secondsSince = (Date.now() - new Date(user.lastOtpSentAt).getTime()) / 1000;
      if (secondsSince < OTP_RESEND_COOLDOWN_SECONDS) {
        return res.status(429).json({ message: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSince)} seconds before requesting another code.` });
      }
    }

    const verificationOtp = generateVerificationOtp();
    setVerificationOtp(user, verificationOtp);
    await user.save();

    await sendVerificationOtpEmail(email, user.name, verificationOtp);

    const payload = {
      message: 'Verification code sent. Please check your email.',
      otpExpiresInMinutes: OTP_EXPIRY_MINUTES,
    };
    if (process.env.NODE_ENV !== 'production') payload.devOtp = verificationOtp;

    res.json(payload);
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
  // new exports
  sendSignupOtp,
  verifySignupOtp,
  sendLoginOtp,
  verifyLoginOtp,
};
