const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authGuard');

router.get('/', protect, notificationController.getNotifications);
router.put('/:id/read', protect, notificationController.markAsRead);

module.exports = router;
