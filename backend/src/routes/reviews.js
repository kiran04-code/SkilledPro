const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { submitReview, getWorkerReviews } = require('../controllers/reviewController');

router.post('/', protect, submitReview);
router.get('/:workerId', getWorkerReviews);

module.exports = router;