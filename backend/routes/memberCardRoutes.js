const express = require('express');
const router = express.Router();
const memberCardController = require('../controllers/memberCardController');
const { protect } = require('../middleware/authGuard');

router.get('/me', protect, memberCardController.getMyCards);
router.get('/user/:userId', protect, memberCardController.getMemberCards);
router.post('/', protect, memberCardController.addMemberCard);
router.put('/:id', protect, memberCardController.editMemberCard);
router.delete('/:id', protect, memberCardController.deleteMemberCard);

module.exports = router;
