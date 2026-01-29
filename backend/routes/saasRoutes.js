const express = require('express');
const router = express.Router();
const saasController = require('../controllers/saasController');

router.post('/register-church', saasController.registerChurch);
router.get('/church-public-info/:subdomain', saasController.getChurchPublicInfo);
router.get('/global-stats', saasController.getGlobalStats);

const superAdminController = require('../controllers/superAdminController');

// Super Admin Church Management
router.get('/users/search', superAdminController.searchGlobalUsers); // Search Route
router.get('/churches', superAdminController.getAllChurches);
router.get('/churches/:id', superAdminController.getChurchDetails); // New Route
router.get('/churches/:id/users', superAdminController.getChurchUsers); // New Route: Get Users
router.get('/users/:id', superAdminController.getMemberDetails); // New Route: Get Single User Details
router.put('/churches/:id/status', superAdminController.updateChurchStatus);
router.delete('/churches/:id', superAdminController.deleteChurch);

// Super Admin Plan Management
router.post('/plans', superAdminController.createPlan);
router.get('/plans', superAdminController.getPlans);
router.put('/plans/:id', superAdminController.updatePlan);
router.delete('/plans/:id', superAdminController.deletePlan);

module.exports = router;
