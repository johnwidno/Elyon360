/**
 * Content Routes
 * Organization content publishing and church content adoption endpoints
 *
 * Routes:
 * - /api/networks/:networkId/content/* (organization endpoints)
 * - /api/churches/:churchId/available-content/* (church endpoints)
 * - /api/churches/:churchId/content-decisions/* (church endpoints)
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const contentController = require('../controllers/contentController');
const adoptionController = require('../controllers/adoptionController');
const { verifyJWT, requirePermission } = require('../middleware/verifyJWT');
const { ensureNetworkIsolation, ensureChurchIsolation } = require('../middleware/ensureNetworkIsolation');
const { apiRateLimiter } = require('../middleware/rateLimiter');

// ===== ORGANIZATION CONTENT ENDPOINTS (Publish Content) =====

/**
 * POST /api/networks/:networkId/content
 * Create new content (draft)
 * Requires: org:manage_content permission
 */
router.post(
  '/networks/:networkId/content',
  verifyJWT,
  ensureNetworkIsolation,
  apiRateLimiter,
  requirePermission('org:manage_content'),
  contentController.createContent,
);

/**
 * GET /api/networks/:networkId/content
 * List published content
 * Requires: org:view_content permission
 */
router.get(
  '/networks/:networkId/content',
  verifyJWT,
  ensureNetworkIsolation,
  apiRateLimiter,
  requirePermission('org:view_content'),
  contentController.listPublishedContent,
);

/**
 * GET /api/networks/:networkId/content/:contentId
 * Get specific content with full details
 * Requires: org:view_content permission
 */
router.get(
  '/networks/:networkId/content/:contentId',
  verifyJWT,
  ensureNetworkIsolation,
  apiRateLimiter,
  requirePermission('org:view_content'),
  contentController.getContent,
);

/**
 * PATCH /api/networks/:networkId/content/:contentId
 * Update draft content
 * Requires: org:manage_content permission
 */
router.patch(
  '/networks/:networkId/content/:contentId',
  verifyJWT,
  ensureNetworkIsolation,
  apiRateLimiter,
  requirePermission('org:manage_content'),
  contentController.updateContent,
);

/**
 * PUT /api/networks/:networkId/content/:contentId/publish
 * Publish draft content
 * Requires: org:manage_content permission
 */
router.put(
  '/networks/:networkId/content/:contentId/publish',
  verifyJWT,
  ensureNetworkIsolation,
  apiRateLimiter,
  requirePermission('org:manage_content'),
  contentController.publishContent,
);

/**
 * DELETE /api/networks/:networkId/content/:contentId
 * Archive content (soft delete)
 * Requires: org:manage_content permission
 */
router.delete(
  '/networks/:networkId/content/:contentId',
  verifyJWT,
  ensureNetworkIsolation,
  apiRateLimiter,
  requirePermission('org:manage_content'),
  contentController.archiveContent,
);

/**
 * GET /api/networks/:networkId/content/:contentId/stats
 * Get adoption statistics for content
 * Requires: org:view_content permission
 */
router.get(
  '/networks/:networkId/content/:contentId/stats',
  verifyJWT,
  ensureNetworkIsolation,
  apiRateLimiter,
  requirePermission('org:view_content'),
  contentController.getContentStats,
);

// ===== CHURCH CONTENT ADOPTION ENDPOINTS =====

/**
 * GET /api/churches/:churchId/available-content
 * List available content from affiliated networks
 * Requires: content:view permission
 */
router.get(
  '/churches/:churchId/available-content',
  verifyJWT,
  ensureChurchIsolation,
  apiRateLimiter,
  requirePermission('content:view'),
  adoptionController.getAvailableContent,
);

/**
 * GET /api/churches/:churchId/content-decisions
 * List church's adoption decisions
 * Requires: content:view permission
 */
router.get(
  '/churches/:churchId/content-decisions',
  verifyJWT,
  ensureChurchIsolation,
  apiRateLimiter,
  requirePermission('content:view'),
  adoptionController.getContentDecisions,
);

/**
 * GET /api/churches/:churchId/content/:contentId/view
 * Record view event for content
 * Requires: content:view permission
 */
router.get(
  '/churches/:churchId/content/:contentId/view',
  verifyJWT,
  ensureChurchIsolation,
  apiRateLimiter,
  requirePermission('content:view'),
  adoptionController.recordView,
);

/**
 * POST /api/churches/:churchId/content/:contentId/adopt
 * Church adopts content
 * Requires: content:adopt permission
 */
router.post(
  '/churches/:churchId/content/:contentId/adopt',
  verifyJWT,
  ensureChurchIsolation,
  apiRateLimiter,
  requirePermission('content:adopt'),
  adoptionController.adoptContent,
);

/**
 * POST /api/churches/:churchId/content/:contentId/ignore
 * Church ignores content
 * Requires: content:adopt permission
 */
router.post(
  '/churches/:churchId/content/:contentId/ignore',
  verifyJWT,
  ensureChurchIsolation,
  apiRateLimiter,
  requirePermission('content:adopt'),
  adoptionController.ignoreContent,
);

/**
 * PATCH /api/churches/:churchId/content/:contentId/share
 * Update content sharing settings
 * Requires: content:adopt permission
 */
router.patch(
  '/churches/:churchId/content/:contentId/share',
  verifyJWT,
  ensureChurchIsolation,
  apiRateLimiter,
  requirePermission('content:adopt'),
  adoptionController.updateSharingSettings,
);

/**
 * DELETE /api/churches/:churchId/content/:contentId
 * Archive content adoption
 * Requires: content:adopt permission
 */
router.delete(
  '/churches/:churchId/content/:contentId',
  verifyJWT,
  ensureChurchIsolation,
  apiRateLimiter,
  requirePermission('content:adopt'),
  adoptionController.archiveContentAdoption,
);

module.exports = router;
