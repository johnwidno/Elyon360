const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authGuard');

router.get('/search', protect, userController.searchMembers);
router.get('/birthdays', protect, userController.getBirthdays);
router.get('/', protect, userController.getAllUsers);
router.put('/change-password', protect, userController.changePassword);

module.exports = router;
