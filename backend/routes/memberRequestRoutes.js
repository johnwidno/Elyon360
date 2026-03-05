const express = require('express');
const router = express.Router();
const memberRequestController = require('../controllers/memberRequestController');
const { protect } = require('../middleware/authGuard');

router.get('/', protect, memberRequestController.getRequests);
router.get('/:id', protect, memberRequestController.getRequestById);
router.post('/', protect, memberRequestController.createRequest);
router.patch('/:id', protect, memberRequestController.updateRequest);
router.delete('/:id', protect, memberRequestController.deleteRequest);

module.exports = router;
