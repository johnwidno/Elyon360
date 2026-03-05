const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { protect } = require('../middleware/authGuard');

// Public route
router.post('/register', visitorController.registerVisitor);

// Protected Admin routes
router.post('/', protect, visitorController.createVisitor);
router.get('/', protect, visitorController.getAllVisitors);
router.put('/:id', protect, visitorController.updateVisitor);
router.delete('/:id', protect, visitorController.deleteVisitor);

// New routes for visitor management
router.patch('/:id/view-status', protect, visitorController.updateViewStatus);
router.post('/:id/convert-to-member', protect, visitorController.convertToMember);

module.exports = router;
