const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMessages, saveMessage } = require('../controllers/messageController');

router.get('/:projectId', protect, getMessages);
router.post('/', protect, saveMessage);

module.exports = router;