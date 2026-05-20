const Bid = require('../models/Bid');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { rankWorkers } = require('../utils/rankingAlgo');
const { sendPushNotification } = require('../utils/pushNotification');

// @POST /api/bids
const submitBid = async (req, res) => {
  try {
    const { projectId, amount, proposal } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Bid amount must be greater than zero' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.status !== 'open') return res.status(400).json({ message: 'Project is not open for bids' });
    if (project.client.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'You cannot bid on your own project' });

    const existingBid = await Bid.findOne({ project: projectId, worker: req.user._id });
    if (existingBid) return res.status(400).json({ message: 'You have already bid on this project' });

    // TEMP: Verification requirement disabled — allow all workers to bid
    // const user = await User.findById(req.user._id);
    // if (user.verificationStatus !== 'approved') {
    //   return res.status(403).json({ message: 'You must be fully verified to submit bids.' });
    // }

    const bid = await Bid.create({
      project: projectId,
      worker: req.user._id,
      amount,
      proposal,
    });

    const notificationMessage = `New bid of ₹${amount} received for "${project.title}"`;
    await Notification.create({
      user: project.client,
      type: 'new_bid',
      message: notificationMessage,
      projectId: project._id,
    });

    // Send Push Notification
    await sendPushNotification(
      project.client,
      'New Bid Received',
      notificationMessage,
      { projectId: project._id.toString(), type: 'new_bid' }
    );

    // Get IO and emit real-time updates
    try {
      const { io } = require('../server');
      if (io) {
        io.to(`user_${project.client}`).emit('notification', {
          message: notificationMessage,
        });
        io.to(project._id.toString()).emit('refresh_project');
      }
    } catch (e) {
      console.error('Socket emission failed:', e);
    }

    res.status(201).json(bid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/bids/:projectId — ranked top 10 bids
const getBidsForProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const bids = await Bid.find({ project: req.params.projectId })
      .populate('worker', 'name avatar skills location avgRating totalJobsDone completionScore isVerified');

    // Rank workers using algorithm
    const workers = bids.map(b => b.worker);
    const ranked = rankWorkers(workers, project);

    // Map back to bids with scores, show top 10
    const rankedBids = ranked.slice(0, 10).map(({ worker, score }) => {
      const bid = bids.find(b => b.worker._id.toString() === worker._id.toString());
      return {
        ...bid._doc,
        worker,
        rankScore: score,
        rankBreakdown: {
          skillMatch: worker.skills.some(s => s.toLowerCase() === project.skill.toLowerCase()) ? 30 : 0,
          rating: parseFloat(((worker.avgRating / 5) * 20).toFixed(1)),
          completionRate: parseFloat((Math.min(worker.totalJobsDone / 100, 1) * 20).toFixed(1)),
          distance: worker.location?.toLowerCase() === project.location?.toLowerCase() ? 15 : 5,
          reliability: parseFloat(((worker.completionScore / 100) * 15).toFixed(1)),
        }
      };
    });

    res.json({ total: bids.length, showing: rankedBids.length, bids: rankedBids });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitBid, getBidsForProject };