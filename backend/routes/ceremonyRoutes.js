const express = require('express');
const router = express.Router();
const ceremonyController = require('../controllers/ceremonyController');
const { protect } = require('../middleware/authGuard');

router.post('/', protect, ceremonyController.createCeremony);
router.get('/', protect, ceremonyController.getCeremonies);

module.exports = router;
