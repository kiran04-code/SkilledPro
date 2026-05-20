const express = require('express');
const router = express.Router();
const { protect, isClient } = require('../middleware/auth');
const {
  getWorkers,
  getWorkerById,
  updateProfile,
  updateFcmToken,
  updateSettings
} = require('../controllers/userController');

// Allow public access to view workers
router.get('/workers', getWorkers);
router.get('/:id', getWorkerById);
router.put('/profile', protect, updateProfile);
router.put('/fcm-token', protect, updateFcmToken);
router.put('/settings', protect, updateSettings);

module.exports = router;