/**
 * Consent Routes
 * Endpoints for church admins to manage data consent settings
 *
 * Routes:
 * - GET /api/churches/:churchId/data-consent (requires auth + church isolation)
 * - GET /api/churches/:churchId/data-consent/:networkId
 * - PATCH /api/churches/:churchId/data-consent/:networkId
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const consentController = require('../controllers/consentController');
const { verifyJWT, requirePermission } = require('../middleware/verifyJWT');
const { ensureChurchIsolation } = require('../middleware/ensureNetworkIsolation');
const { apiRateLimiter } = require('../middleware/rateLimiter');

/**
 * GET /api/churches/:churchId/data-consent
 * Get all consent settings for a church
 *
 * Requires:
 * - Valid JWT (authenticated)
 * - churchId matches JWT
 * - Permission: settings:read
 */
router.get(
  '/:churchId/data-consent',
  verifyJWT,
  ensureChurchIsolation,
  apiRateLimiter,
  requirePermission('settings:read'),
  consentController.getChurchConsent,
);

/**
 * GET /api/churches/:churchId/data-consent/:networkId
 * Get consent settings for specific network
 *
 * Requires:
 * - Valid JWT (authenticated)
 * - churchId matches JWT
 * - Permission: settings:read
 */
router.get(
  '/:churchId/data-consent/:networkId',
  verifyJWT,
  ensureChurchIsolation,
  apiRateLimiter,
  requirePermission('settings:read'),
  consentController.getNetworkConsent,
);

/**
 * PATCH /api/churches/:churchId/data-consent/:networkId
 * Update consent settings for network
 *
 * Body:
 * {
 *   shareFinancialData: boolean,
 *   shareMembershipData: boolean,
 *   shareEventData: boolean,
 *   shareActivityData: boolean,
 *   shareAttendanceData: boolean,
 *   shareDetailedFinances: boolean,
 *   shareMemberNames: boolean
 * }
 *
 * Requires:
 * - Valid JWT (authenticated)
 * - churchId matches JWT
 * - Permission: settings:write
 */
router.patch(
  '/:churchId/data-consent/:networkId',
  verifyJWT,
  ensureChurchIsolation,
  apiRateLimiter,
  requirePermission('settings:write'),
  consentController.updateNetworkConsent,
);

module.exports = router;
