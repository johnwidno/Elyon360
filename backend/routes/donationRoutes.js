const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { protect, hasPermission } = require('../middleware/authGuard');

router.post('/', protect, hasPermission('finances'), donationController.createDonation);
router.get('/', protect, hasPermission('finances'), donationController.getChurchDonations);
router.get('/my', protect, donationController.getUserDonations); // Anyone can see their own
router.get('/stats', protect, hasPermission('finances'), donationController.getDonationStats);
router.get('/overview', protect, hasPermission('finances'), donationController.getFinancesOverview);
router.get('/balances', protect, hasPermission('finances'), donationController.getBalances);

module.exports = router;
