const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skilledpro/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  },
});

// Storage for portfolio
const portfolioStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'skilledpro/portfolio',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      resource_type: 'auto',
      ...(isImage && { transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] })
    };
  },
});

// Storage for before/after photos
const beforeAfterStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skilledpro/before-after',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  },
});

// Storage for verification documents
const verificationStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'skilledpro/verification',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      resource_type: 'auto',
      ...(isImage && { transformation: [{ width: 1500, crop: 'limit', quality: 'auto' }] })
    };
  },
});

const uploadAvatar = multer({ storage: avatarStorage });
const uploadPortfolio = multer({ storage: portfolioStorage });
const uploadBeforeAfter = multer({ storage: beforeAfterStorage });
const uploadVerification = multer({ storage: verificationStorage });

module.exports = { cloudinary, uploadAvatar, uploadPortfolio, uploadBeforeAfter, uploadVerification };