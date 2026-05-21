const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['client', 'worker'], default: 'client' },
  phone: { type: String, default: '' },
  phoneVerified: { type: Boolean, default: false },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  category: { type: String, default: '' },
  location: { type: String, default: '' },
  locationCoords: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  githubUrl: { type: String, default: '' },
  portfolioUrls: [{ type: String }],
  beforeAfterPhotos: [{ type: String }],
  
  // Document Verification System
  verificationStatus: { 
    type: String, 
    enum: ['not_submitted', 'pending', 'in_review', 'approved', 'rejected'], 
    default: 'not_submitted' 
  },
  verificationRemark: { type: String, default: '' },
  identityProof: { type: String, default: '' },
  addressProof: { type: String, default: '' },
  workProofs: [{ type: String }],
  isVerified: { type: Boolean, default: false }, // Kept for backward compatibility but deprecated in favor of verificationStatus
  isAdmin: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  profileImage: { type: String, default: '' },
  companyName: { type: String, default: '' },
  bio: { type: String, default: '' },
  verificationToken: { type: String, default: null },
  verificationTokenExpiry: { type: Date, default: null },
  // One-time-password fields (for email OTP verification)
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  lastOtpSentAt: { type: Date, default: null },
  avgRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalJobsDone: { type: Number, default: 0 },
  completionScore: { type: Number, default: 0 },
  areaJobHistory: [{ area: String, count: Number }],
  escrowBalance: { type: Number, default: 0 },
  fcmToken: { type: String, default: null },
  recoveryEmail: { type: String, default: '' },
  recoveryPhone: { type: String, default: '' },
}, { timestamps: true });
userSchema.index({ locationCoords: '2dsphere' });

module.exports = mongoose.model('User', userSchema);