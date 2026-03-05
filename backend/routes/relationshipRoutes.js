const express = require('express');
const router = express.Router();
const relationshipController = require('../controllers/relationshipController');
const { protect } = require('../middleware/authGuard');

// Member-to-Member Relationships
router.post('/', protect, relationshipController.addRelationship);
router.put('/:id', protect, relationshipController.editRelationship);
router.get('/user/:userId', protect, relationshipController.getUserRelationships);
router.delete('/:id', protect, relationshipController.deleteRelationship);

// Organization Roles
router.post('/organization-role', protect, relationshipController.addOrganizationRole);
router.put('/organization-role/:userId/:organizationId', protect, relationshipController.editOrganizationRole);
router.get('/user/:userId/organization-roles', protect, relationshipController.getUserOrganizationRoles);
router.delete('/organization-role/:userId/:organizationId', protect, relationshipController.deleteOrganizationRole);

module.exports = router;
