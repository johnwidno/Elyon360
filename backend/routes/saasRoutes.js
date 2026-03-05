const express = require('express');
const router = express.Router();
const saasController = require('../controllers/saasController');
const superAdminController = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/authGuard');

const saFullAccess = [protect, authorize('super_admin')];
const saReadOnly = [protect, authorize('super_admin', 'super_admin_secretaire', 'superaduser')];

router.post('/register-church', saasController.registerChurch);
// MonCash payment verification
router.get('/payment/verify', saasController.verifyPayment);
// Stripe payment verification
router.get('/payment/stripe/verify', saasController.verifyStripePayment);
// Manual payment verification (fallback when MonCash redirect fails)
router.post('/payment/verify-pending', saasController.verifyPendingPayment);

// Webhook routes for asynchronous activation
router.post('/payment/stripe/webhook', saasController.handleStripeWebhook);
router.post('/payment/moncash/webhook', saasController.handleMonCashWebhook);

router.get('/church-public-info/:subdomain', saasController.getChurchPublicInfo);
router.get('/global-stats', saasController.getGlobalStats);


// Super Admin Church Management
router.get('/superadmin/stats', saReadOnly, superAdminController.getSuperAdminStats);
router.get('/superadmin/transactions', saReadOnly, superAdminController.getTransactions);
router.get('/users/search', saReadOnly, superAdminController.searchGlobalUsers); // Search Route
router.get('/churches', saReadOnly, superAdminController.getAllChurches);
router.get('/churches/:id', saReadOnly, superAdminController.getChurchDetails); // New Route
router.get('/churches/:id/users', saReadOnly, superAdminController.getChurchUsers); // New Route: Get Users
router.get('/users/:id', saReadOnly, superAdminController.getMemberDetails); // New Route: Get Single User Details
router.put('/users/:id', saFullAccess, superAdminController.updateMemberDetails); // New Route: Update User Details
router.delete('/users/:id', saFullAccess, superAdminController.deleteMemberDetails); // New Route: Delete User
router.put('/churches/:id/status', saFullAccess, superAdminController.updateChurchStatus);
router.put('/churches/:id/details', saFullAccess, superAdminController.updateChurchDetails);
router.delete('/churches/:id', saFullAccess, superAdminController.deleteChurch);

// Super Admin Plan Management
router.post('/plans', saFullAccess, superAdminController.createPlan);
router.get('/plans', superAdminController.getPublicPlans);   // Public: used on church registration form
router.get('/plans/all', saReadOnly, superAdminController.getPlans);  // Protected: full list for super admin
router.put('/plans/:id', saFullAccess, superAdminController.updatePlan);
router.delete('/plans/:id', saFullAccess, superAdminController.deletePlan);

module.exports = router;
