const express = require('express');
const rbacController = require('../controllers/rbacController');
const { protect } = require('../middleware/authGuard');
const validateChurchDomain = require('../middleware/validateChurchDomain');
const validateNetworkDomain = require('../middleware/validateNetworkDomain');

const router = express.Router();

// ===== PERMISSIONS ENDPOINTS =====
/**
 * GET /api/permissions
 * List all permissions (optionally filtered by domain)
 */
router.get('/permissions', protect, rbacController.listPermissions);

// ===== CHURCH ROLE ENDPOINTS =====
/**
 * GET /api/churches/:churchId/roles
 * List all roles for a church
 */
router.get('/churches/:churchId/roles', protect, validateChurchDomain, rbacController.listChurchRoles);

/**
 * POST /api/churches/:churchId/roles
 * Create a new role for a church
 */
router.post('/churches/:churchId/roles', protect, validateChurchDomain, rbacController.createChurchRole);

/**
 * PATCH /api/roles/:roleId
 * Update a role
 */
router.patch('/roles/:roleId', protect, rbacController.updateRole);

/**
 * DELETE /api/roles/:roleId
 * Delete a role
 */
router.delete('/roles/:roleId', protect, rbacController.deleteRole);

// ===== ROLE ASSIGNMENT ENDPOINTS =====
/**
 * POST /api/churches/:churchId/user-roles
 * Assign a role to a user
 */
router.post('/churches/:churchId/user-roles', protect, validateChurchDomain, rbacController.assignRoleToUser);

/**
 * DELETE /api/user-roles/:assignmentId
 * Remove a role from a user
 */
router.delete('/user-roles/:assignmentId', protect, rbacController.removeRoleFromUser);

/**
 * GET /api/churches/:churchId/users/:userId/roles
 * Get all roles assigned to a user in a church
 */
router.get('/churches/:churchId/users/:userId/roles', protect, validateChurchDomain, rbacController.getUserRolesInChurch);

// ===== NETWORK ROLE ENDPOINTS =====
/**
 * GET /api/networks/:networkId/roles
 * List all roles for a network (organization domain)
 */
router.get('/networks/:networkId/roles', protect, validateNetworkDomain, rbacController.listNetworkRoles);

module.exports = router;
