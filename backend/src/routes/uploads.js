const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadAvatar, uploadPortfolio, uploadBeforeAfter } = require('../config/cloudinary');
const User = require('../models/User');
const Project = require('../models/Project');

// @POST /api/uploads/avatar
router.post('/avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findById(req.user._id);
    user.avatar = req.file.path;

    // Recalculate profile score
    const { calculateProfileScore } = require('../utils/profileScore');
    user.completionScore = calculateProfileScore(user);
    await user.save();

    res.json({ message: 'Avatar uploaded', avatar: req.file.path, completionScore: user.completionScore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/uploads/portfolio
router.post('/portfolio', protect, uploadPortfolio.single('portfolio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findById(req.user._id);
    user.portfolioUrls.push(req.file.path);
    await user.save();

    res.json({ message: 'Portfolio item uploaded', url: req.file.path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/uploads/before-after/:projectId
router.post('/before-after/:projectId', protect, uploadBeforeAfter.fields([
  { name: 'before', maxCount: 1 },
  { name: 'after', maxCount: 1 }
]), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const photos = [];

    if (req.files?.before) photos.push(req.files.before[0].path);
    if (req.files?.after) photos.push(req.files.after[0].path);

    if (photos.length > 0) {
      project.submittedWork.push(...photos);
      await project.save();
    }

    res.json({ message: 'Photos uploaded', photos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/uploads/verification
router.post('/verification', protect, require('../config/cloudinary').uploadVerification.fields([
  { name: 'identityProof', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'workProofs', maxCount: 5 } // up to 5 work proofs
]), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (req.files?.identityProof) user.identityProof = req.files.identityProof[0].path;
    if (req.files?.addressProof) user.addressProof = req.files.addressProof[0].path;
    
    if (req.files?.workProofs) {
      const wps = req.files.workProofs.map(f => f.path);
      user.workProofs = wps;
    }

    // Set status to pending if all mandatory are uploaded.
    // However, logic for submit vs upload might differ. We can set it pending here.
    user.verificationStatus = 'pending';
    await user.save();

    res.json({ message: 'Verification documents uploaded successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/uploads/portfolio
router.delete('/portfolio', protect, async (req, res) => {
  try {
    const { url } = req.body;
    const user = await User.findById(req.user._id);
    user.portfolioUrls = user.portfolioUrls.filter(u => u !== url);
    await user.save();
    res.json({ message: 'Portfolio item removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;