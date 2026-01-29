const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');
const { protect } = require('../middleware/authGuard');

router.post('/send-message', protect, communicationController.sendMessage);
router.get('/history/:userId', protect, communicationController.getMessageHistory);

module.exports = router;
