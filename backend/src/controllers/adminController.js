const User = require('../models/User');
const Project = require('../models/Project');
const { sendPushNotification } = require('../utils/pushNotification');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyWorker = async (req, res) => {
  try {
    const { status, remark } = req.body;
    
    if (!['pending', 'in_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if ((status === 'rejected' || status === 'in_review') && !remark) {
      return res.status(400).json({ message: 'Remark is mandatory when rejecting or putting in review' });
    }

    const updateData = { verificationStatus: status };
    if (remark !== undefined) updateData.verificationRemark = remark;
    if (status === 'approved') updateData.isVerified = true;
    else updateData.isVerified = false;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true }
    ).select('-password');

    // Send Push Notification
    let title = 'Verification Update';
    let body = `Your verification status has been updated to ${status}.`;
    if (status === 'approved') body = 'Congratulations! Your profile is now approved and visible to clients.';
    if (status === 'rejected') body = `Verification rejected. Reason: ${remark}`;
    
    await sendPushNotification(user._id, title, body, { type: 'verification_update', status });

    res.json({ message: `Worker verification updated to ${status}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPlatformRevenue = async (req, res) => {
  try {
    const projects = await Project.find({ paymentReleased: true })
      .populate('client', 'name')
      .populate('selectedWorker', 'name')
      .select('title finalPrice platformFee workerEarnings createdAt');

    const totalRevenue = projects.reduce((sum, p) => sum + p.platformFee, 0);

    res.json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalProjects: projects.length,
      projects,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const startReviewWorker = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { verificationStatus: 'in_review', isVerified: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json({ message: 'Worker status updated to in_review', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllUsers, verifyWorker, getPlatformRevenue, startReviewWorker };