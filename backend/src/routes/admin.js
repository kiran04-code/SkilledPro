const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const { getAllUsers, verifyWorker, getPlatformRevenue, startReviewWorker } = require('../controllers/adminController');

router.get('/users', protect, isAdmin, getAllUsers);
router.put('/verify/:userId', protect, isAdmin, verifyWorker);
router.put('/review/:userId', protect, isAdmin, startReviewWorker);
router.get('/revenue', protect, isAdmin, getPlatformRevenue);

module.exports = router;