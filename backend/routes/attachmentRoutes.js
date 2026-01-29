const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const { protect } = require('../middleware/authGuard');

router.post('/', protect, attachmentController.addAttachment);
router.get('/user/:userId', protect, attachmentController.getAttachments);
router.delete('/:id', protect, attachmentController.deleteAttachment);

module.exports = router;
