const express = require('express');
const router = express.Router();
const controller = require('../controllers/memberAlertController');
const { protect, hasPermission } = require('../middleware/authGuard');

router.get('/:memberId/alerts', protect, hasPermission('members'), controller.getAlerts);
router.post('/:memberId/alerts', protect, hasPermission('members'), controller.createAlert);
router.delete('/:memberId/alerts/:alertId', protect, hasPermission('members'), controller.deleteAlert);

module.exports = router;
