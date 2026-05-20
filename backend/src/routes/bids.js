const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { submitBid, getBidsForProject } = require('../controllers/bidController');
const Bid = require('../models/Bid');

// IMPORTANT: /my-bids must come BEFORE /:projectId
router.get('/my-bids', protect, async (req, res) => {
  try {
    const bids = await Bid.find({ worker: req.user._id })
      .populate('project', 'title skill location budget status client')
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, submitBid);
router.get('/:projectId', protect, getBidsForProject);

module.exports = router;
