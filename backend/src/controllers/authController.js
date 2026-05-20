const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { calculateProfileScore } = require('../utils/profileScore');
// const { sendVerificationEmail } = require('../utils/emailService'); // TEMP: email verification disabled

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/* =============================================
   REGISTER — sends verification email
   ============================================= */
const register = async (req, res) => {
  try {
    const { name, email, password, phone, location, skills, category, lat, lng, role } = req.body;

    // Security validation: Prevent selecting more than 2 skills
    if (skills && Array.isArray(skills) && skills.length > 2) {
      return res.status(400).json({ message: 'You can select a maximum of 2 skills.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // TEMP: Email verification disabled — tokens not generated
    // const rawToken = crypto.randomBytes(32).toString('hex');
    // const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    // const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let locationCoords = undefined;
    if (lat != null && lng != null) {
      locationCoords = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      };
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      location: location || '',
      skills: skills || [],
      category: category || '',
      role: role || 'client',
      locationCoords,
      emailVerified: true, // TEMP: auto-verify on registration
      // verificationToken: hashedToken,
      // verificationTokenExpiry: tokenExpiry,
    });

    // Calculate initial profile score locally, then do a single database write
    user.completionScore = calculateProfileScore(user);
    await user.save();

    // TEMP: Email verification disabled — skipping email send
    // try {
    //   await sendVerificationEmail(email, name, rawToken);
    // } catch (emailErr) {
    //   console.error('Verification email failed to send:', emailErr.message);
    // }

    res.status(201).json({
      message: 'Registration successful! You can now log in.',
      requiresVerification: false,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =============================================
   LOGIN — blocks unverified users
   ============================================= */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // TEMP: Email verification check disabled
    // if (!user.emailVerified) {
    //   return res.status(403).json({
    //     message: 'Please verify your email before logging in.',
    //     requiresVerification: true,
    //     email: user.email,
    //   });
    // }

    const userObj = user.toObject();
    delete userObj.password;
    userObj.token = generateToken(user._id);

    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =============================================
   VERIFY EMAIL — called from the link in email
   ============================================= */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is missing.' });
    }

    // Hash the incoming token to compare against DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: Date.now() }, // not expired
    });

    if (!user) {
      return res.status(400).json({
        message: 'This verification link is invalid or has expired. Please request a new one.',
        expired: true,
      });
    }

    // Activate the account
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    res.json({
      message: 'Email verified successfully! You can now log in.',
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =============================================
   RESEND VERIFICATION EMAIL
   ============================================= */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email });

    if (!user) {
      // Return generic message to prevent email enumeration
      return res.json({ message: 'If this email exists, a verification link has been sent.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'This account is already verified. Please log in.' });
    }

    // Generate a new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = hashedToken;
    user.verificationTokenExpiry = tokenExpiry;
    await user.save();

    await sendVerificationEmail(email, user.name, rawToken);

    res.json({ message: 'Verification email resent. Please check your inbox.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =============================================
   GET ME
   ============================================= */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe, verifyEmail, resendVerification };
