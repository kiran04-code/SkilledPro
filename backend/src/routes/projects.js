const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createProject,
  getProjects,
  getProjectById,
  acceptBidAndEscrow,
  markWorkCompleted,
  releasePayment,
  requestPriceRevision,
  respondPriceRevision,
  cancelProject,
} = require('../controllers/projectController');

router.post('/', protect, createProject);
router.get('/', getProjects);
router.get('/:id', protect, getProjectById);
router.put('/:id/accept-bid', protect, acceptBidAndEscrow);
router.put('/:id/complete', protect, markWorkCompleted);
router.put('/:id/release-payment', protect, releasePayment);
router.post('/:id/price-revision', protect, requestPriceRevision);
router.put('/:id/price-revision', protect, respondPriceRevision);
router.put('/:id/cancel', protect, cancelProject);
router.get('/:id/revisions', protect, async (req, res) => {
  try {
    const PriceRevision = require('../models/PriceRevision');
    const revisions = await PriceRevision.find({ project: req.params.id })
      .sort({ createdAt: -1 });
    res.json(revisions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;