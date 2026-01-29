const express = require('express');
const router = express.Router();
const orgController = require('../controllers/organizationController');
const { protect, hasPermission } = require('../middleware/authGuard');

router.use(protect);
router.use(hasPermission('members'));

router.get('/', orgController.getAllOrganizations);
router.get('/:id', orgController.getOneOrganization);
router.post('/', orgController.createOrganization);
router.put('/:id', orgController.updateOrganization);
router.delete('/:id', orgController.deleteOrganization);

module.exports = router;
