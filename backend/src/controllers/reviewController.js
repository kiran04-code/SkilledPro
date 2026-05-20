const Review = require('../models/Review');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

const getIO = () => {
  try {
    const { io } = require('../server');
    return io;
  } catch (e) { return null; }
};

const submitReview = async (req, res) => {
  try {
    const { projectId, rating, comment } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.paymentReleased)
      return res.status(400).json({ message: 'Payment must be released before reviewing' });
    if (project.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only client can review' });

    const existing = await Review.findOne({ project: projectId });
    if (existing) return res.status(400).json({ message: 'Already reviewed' });

    const review = await Review.create({
      project: projectId,
      client: req.user._id,
      worker: project.selectedWorker,
      rating,
      comment,
    });

    // Update worker average rating
    const allReviews = await Review.find({ worker: project.selectedWorker });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    const newAvg = parseFloat(avg.toFixed(1));

    await User.findByIdAndUpdate(project.selectedWorker, {
      avgRating: newAvg,
      totalReviews: allReviews.length,
    });

    await Notification.create({
      user: project.selectedWorker,
      type: 'review_received',
      message: `You received a ${rating}-star review for "${project.title}": "${comment}"`,
      projectId: project._id,
    });

    // Emit socket events to update worker's dashboard in real-time
    const io = getIO();
    if (io) {
      // Notify worker's personal room
      io.to(`user_${project.selectedWorker}`).emit('notification', {
        message: `You received a ${rating}-star review!`,
      });
      // Also emit refresh to project room
      io.to(projectId.toString()).emit('refresh_project');
    }

    res.status(201).json({ review, newAvgRating: newAvg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWorkerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ worker: req.params.workerId })
      .populate('client', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitReview, getWorkerReviews };