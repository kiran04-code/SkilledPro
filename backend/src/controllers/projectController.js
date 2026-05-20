const Project = require('../models/Project');
const Bid = require('../models/Bid');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { calculateCommission } = require('../utils/commissionCalc');
const { sendPushNotification } = require('../utils/pushNotification');

/* =========================
   SOCKET SAFE ACCESS
========================= */

const getIO = () => {
  try {
    const { io } = require('../server');
    return io;
  } catch (e) {
    return null;
  }
};

const emitProjectUpdate = (projectId) => {
  const io = getIO();
  if (io) io.to(projectId.toString()).emit('refresh_project');
};

/* =========================
   CREATE PROJECT
========================= */
const createProject = async (req, res) => {
  try {
    const { title, description, skill, location, budget, lat, lng } = req.body;
    
    if (!budget || budget <= 0) {
      return res.status(400).json({ message: 'Budget must be greater than zero' });
    }
    const project = await Project.create({
      client: req.user._id,
      title, description, skill, location, budget,
      locationCoords: {
        type: 'Point',
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0]
      }
    });

    // Notify all workers with matching skill
    const matchingWorkers = await User.find({
      skills: { $in: [new RegExp(skill, 'i')] },
      _id: { $ne: req.user._id },
      isAdmin: { $ne: true },
    }).select('_id');

    const io = getIO();

    for (const worker of matchingWorkers) {
      await Notification.create({
        user: worker._id,
        type: 'new_bid',
        message: `New project posted: "${title}" in ${location} — Budget ₹${budget}. Matches your skill: ${skill}!`,
        projectId: project._id,
      });

      // Real-time notification
      if (io) {
        io.to(`user_${worker._id}`).emit('notification', {
          message: `New ${skill} project posted in ${location} — ₹${budget}!`,
        });
      }

      // Push Notification
      await sendPushNotification(
        worker._id,
        'New Project Posted',
        `New ${skill} project posted in ${location} — ₹${budget}!`,
        { projectId: project._id.toString(), type: 'new_project' }
      );
    }

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET PROJECTS
========================= */

const getProjects = async (req, res) => {
  try {
    const { skill, location, status } = req.query;
    let matchFilter = {};

    if (skill) matchFilter.skill = new RegExp(skill, 'i');
    if (location) matchFilter.location = new RegExp(location, 'i');
    if (status) matchFilter.status = status;

    const projects = await Project.aggregate([
      { $match: matchFilter },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'bids',
          localField: '_id',
          foreignField: 'project',
          as: 'bids',
        },
      },
      {
        $addFields: {
          bidCount: { $size: '$bids' },
        },
      },
      {
        $project: {
          title: 1, description: 1, skill: 1, location: 1,
          budget: 1, status: 1, client: 1, createdAt: 1,
          agreedPrice: 1, selectedWorker: 1, progress: 1,
          bidCount: 1, finalPrice: 1, escrowPaid: 1, revisedPrice: 1,
        },
      },
    ]);

    // Populate client manually after aggregation
    await Project.populate(projects, { path: 'client', select: 'name avatar location' });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET PROJECT BY ID
========================= */

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name avatar location avgRating')
      .populate('selectedWorker', 'name avatar location avgRating skills'); // ✅ phone permanently excluded

    if (!project)
      return res.status(404).json({ message: 'Project not found' });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   ACCEPT BID + ESCROW
========================= */

const acceptBidAndEscrow = async (req, res) => {
  try {
    const { bidId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).json({ message: 'Project not found' });

    if (project.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const acceptedBid = await Bid.findById(bidId);
    if (!acceptedBid)
      return res.status(404).json({ message: 'Bid not found' });

    acceptedBid.status = 'accepted';
    await acceptedBid.save();

    await Bid.updateMany(
      { project: project._id, _id: { $ne: bidId } },
      { status: 'closed' }
    );

    project.selectedWorker = acceptedBid.worker;
    project.agreedPrice = acceptedBid.amount;
    project.finalPrice = acceptedBid.amount;
    project.status = 'in_progress';
    project.escrowPaid = true;
    await project.save();

    await Notification.create({
      user: acceptedBid.worker,
      type: 'bid_accepted',
      message: `Your bid of ₹${acceptedBid.amount} was accepted for "${project.title}". Client has paid into escrow.`,
      projectId: project._id,
    });

    const closedBids = await Bid.find({
      project: project._id,
      status: 'closed',
    });

    for (const bid of closedBids) {
      await Notification.create({
        user: bid.worker,
        type: 'bid_closed',
        message: `Your bid for "${project.title}" was not selected.`,
        projectId: project._id,
      });
    }

    const io = getIO();
    if (io) {
      io.to(`user_${acceptedBid.worker}`).emit('notification', {
        message: `Your bid was accepted for "${project.title}"!`,
      });
    }

    // Push Notification
    await sendPushNotification(
      acceptedBid.worker,
      'Bid Accepted!',
      `Your bid was accepted for "${project.title}"! Client has paid into escrow.`,
      { projectId: project._id.toString(), type: 'bid_accepted' }
    );

    emitProjectUpdate(project._id);

    res.json({
      message: 'Bid accepted, escrow payment simulated',
      project,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   MARK WORK COMPLETED
========================= */

const markWorkCompleted = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).json({ message: 'Project not found' });

    if (project.selectedWorker.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    project.workCompletedByWorker = true;
    await project.save();

    await Notification.create({
      user: project.client,
      type: 'work_completed',
      message: `Worker has marked "${project.title}" as completed. Please verify and release payment.`,
      projectId: project._id,
    });

    const io = getIO();
    if (io) {
      io.to(`user_${project.client}`).emit('notification', {
        message: `Worker marked "${project.title}" as completed!`,
      });
    }

    emitProjectUpdate(project._id);

    res.json({ message: 'Work marked as completed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   RELEASE PAYMENT
========================= */

const releasePayment = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).json({ message: 'Project not found' });

    if (project.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    if (!project.workCompletedByWorker)
      return res.status(400).json({
        message: 'Worker has not marked work as completed yet',
      });

    const { platformFee, workerEarnings } =
      calculateCommission(project.finalPrice);

    project.platformFee = platformFee;
    project.workerEarnings = workerEarnings;
    project.paymentReleased = true;
    project.status = 'completed';
    await project.save();

    await User.findByIdAndUpdate(project.selectedWorker, {
      $inc: { totalJobsDone: 1, escrowBalance: workerEarnings },
    });

    const notification = await Notification.create({
      user: project.selectedWorker,
      type: 'payment_received',
      message: `Payment released for "${project.title}". You earned ₹${workerEarnings} (₹${platformFee} platform fee deducted).`,
      amount: workerEarnings,
      projectId: project._id,
    });

    const io = getIO();
    if (io) {
      io.to(`user_${project.selectedWorker}`).emit('payment_notification', {
        message: notification.message,
        amount: workerEarnings,
        platformFee,
        totalPrice: project.finalPrice,
      });
    }

    // Push Notification
    await sendPushNotification(
      project.selectedWorker,
      'Payment Released!',
      `Payment of ₹${workerEarnings} released for "${project.title}". Check your escrow balance.`,
      { projectId: project._id.toString(), type: 'payment_received' }
    );

    emitProjectUpdate(project._id);

    res.json({
      message: 'Payment released successfully',
      breakdown: {
        totalPrice: project.finalPrice,
        platformFee,
        workerEarnings,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   PRICE REVISION REQUEST
========================= */

const requestPriceRevision = async (req, res) => {
  try {
    const { newPrice, reason } = req.body;

    if (!newPrice || newPrice <= 0) {
      return res.status(400).json({ message: 'Revised price must be greater than zero' });
    }

    const project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).json({ message: 'Project not found' });

    if (project.selectedWorker.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    if (project.revisionCount >= project.maxRevisions)
      return res.status(400).json({
        message: `Maximum ${project.maxRevisions} revisions allowed.`,
      });

    if (project.revisionStatus === 'pending')
      return res.status(400).json({
        message: 'A revision request is already pending',
      });

    project.revisedPrice = newPrice;
    project.revisionStatus = 'pending';
    project.revisionCount += 1;
    await project.save();

    const PriceRevision = require('../models/PriceRevision');
    await PriceRevision.create({
      project: project._id,
      worker: req.user._id,
      oldPrice: project.finalPrice || project.agreedPrice,
      newPrice,
      reason,
      status: 'pending',
    });

    await Notification.create({
      user: project.client,
      type: 'revision_request',
      message: `Worker requests price revision to ₹${newPrice} for "${project.title}". Reason: ${reason}`,
      projectId: project._id,
    });

    const io = getIO();
    if (io) {
      io.to(`user_${project.client}`).emit('notification', {
        message: `Worker requested price revision to ₹${newPrice}`,
      });
    }

    // Push Notification
    await sendPushNotification(
      project.client,
      'Price Revision Requested',
      `Worker requests price revision to ₹${newPrice} for "${project.title}".`,
      { projectId: project._id.toString(), type: 'revision_request' }
    );

    emitProjectUpdate(project._id);

    res.json({
      message: 'Price revision requested',
      revisionCount: project.revisionCount,
      maxRevisions: project.maxRevisions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   RESPOND TO REVISION
========================= */

const respondPriceRevision = async (req, res) => {
  try {
    const { accept } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).json({ message: 'Project not found' });

    if (project.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const PriceRevision = require('../models/PriceRevision');
    await PriceRevision.findOneAndUpdate(
      { project: project._id, status: 'pending' },
      { status: accept ? 'accepted' : 'rejected' }
    );

    if (accept) {
      project.finalPrice = project.revisedPrice;
      project.revisionStatus = 'accepted';
    } else {
      project.revisionStatus = 'rejected';
    }

    await project.save();

    const revisionsLeft =
      project.maxRevisions - project.revisionCount;

    await Notification.create({
      user: project.selectedWorker,
      type: 'revision_response',
      message: accept
        ? `Client accepted your price revision.`
        : `Client rejected your price revision. ${revisionsLeft} left.`,
      projectId: project._id,
    });

    const io = getIO();
    if (io) {
      io.to(`user_${project.selectedWorker}`).emit('notification', {
        message: accept
          ? 'Client accepted your revision!'
          : `Client rejected your revision. ${revisionsLeft} left.`,
      });
    }

    // Push Notification
    await sendPushNotification(
      project.selectedWorker,
      accept ? 'Price Revision Accepted' : 'Price Revision Rejected',
      accept
        ? `Client accepted your price revision for "${project.title}".`
        : `Client rejected your price revision for "${project.title}".`,
      { projectId: project._id.toString(), type: 'revision_response' }
    );

    emitProjectUpdate(project._id);

    res.json({
      message: accept ? 'Revision accepted' : 'Revision rejected',
      project,
      revisionsLeft,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   CANCEL PROJECT
========================= */

const cancelProject = async (req, res) => {
  try {
    const { reason } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).json({ message: 'Project not found' });

    const isClient =
      project.client.toString() === req.user._id.toString();
    const isWorker =
      project.selectedWorker?.toString() === req.user._id.toString();

    if (!isClient && !isWorker)
      return res.status(403).json({ message: 'Not authorized' });

    if (project.paymentReleased)
      return res.status(400).json({
        message: 'Cannot cancel after payment is released',
      });

    project.status = 'cancelled';
    project.cancelledBy = isClient ? 'client' : 'worker';
    project.cancellationReason = reason || 'No reason provided';
    project.refundIssued = true;
    await project.save();

    const notifyUser = isClient
      ? project.selectedWorker
      : project.client;

    const io = getIO();
    if (io) {
      io.to(`user_${notifyUser}`).emit('notification', {
        message: `Project "${project.title}" was cancelled.`,
      });
    }

    // Push Notification
    await sendPushNotification(
      notifyUser,
      'Project Cancelled',
      `The project "${project.title}" has been cancelled.`,
      { projectId: project._id.toString(), type: 'project_cancelled' }
    );

    emitProjectUpdate(project._id);

    res.json({
      message: 'Project cancelled successfully',
      refundIssued: true,
      refundAmount: project.agreedPrice,
      cancelledBy: project.cancelledBy,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   EXPORTS
========================= */

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  acceptBidAndEscrow,
  markWorkCompleted,
  releasePayment,
  requestPriceRevision,
  respondPriceRevision,
  cancelProject,
};