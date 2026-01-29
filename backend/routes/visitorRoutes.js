const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { protect } = require('../middleware/authGuard');

// Public route
router.post('/register', visitorController.registerVisitor);

// Protected Admin routes
router.get('/', protect, visitorController.getAllVisitors);
router.put('/:id', protect, visitorController.updateVisitor);
router.delete('/:id', protect, visitorController.deleteVisitor);

module.exports = router;
