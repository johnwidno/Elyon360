/**
 * Dashboard Routes
 * Endpoints for organization admins to view network dashboards
 *
 * Routes:
 * - GET /api/networks/:networkId/dashboard (requires auth + network isolation)
 * - GET /api/networks/:networkId/dashboard/member-metrics
 * - GET /api/networks/:networkId/dashboard/financial-metrics
 * - GET /api/networks/:networkId/dashboard/content-adoption
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const dashboardController = require('../controllers/dashboardController');
const { verifyJWT, requirePermission } = require('../middleware/verifyJWT');
const { ensureNetworkIsolation } = require('../middleware/ensureNetworkIsolation');
const { apiRateLimiter } = require('../middleware/rateLimiter');

/**
 * GET /api/networks/:networkId/dashboard
 * Get network dashboard with aggregated data
 *
 * Requires:
 * - Valid JWT (authenticated)
 * - networkId matches JWT
 * - Permission: org:view_dashboard
 */
router.get(
  '/:networkId/dashboard',
  verifyJWT,
  ensureNetworkIsolation,
  apiRateLimiter,
  requirePermission('org:view_dashboard'),
  dashboardController.getNetworkDashboard,
);

/**
 * GET /api/networks/:networkId/dashboard/member-metrics
 * Get detailed member metrics (consent-filtered)
 *
 * Requires:
 * - Valid JWT (authenticated)
 * - networkId matches JWT
 * - Permission: org:view_dashboard
 */
router.get(
  '/:networkId/dashboard/member-metrics',
  verifyJWT,
  ensureNetworkIsolation,
  apiRateLimiter,
  requirePermission('org:view_dashboard'),
  dashboardController.getMemberMetrics,
);

/**
 * GET /api/networks/:networkId/dashboard/financial-metrics
 * Get detailed financial metrics (consent-filtered)
 *
 * Requires:
 * - Valid JWT (authenticated)
 * - networkId matches JWT
 * - Permission: org:view_dashboard
 */
router.get(
  '/:networkId/dashboard/financial-metrics',
  verifyJWT,
  ensureNetworkIsolation,
  apiRateLimiter,
  requirePermission('org:view_dashboard'),
  dashboardController.getFinancialMetrics,
);

/**
 * GET /api/networks/:networkId/dashboard/content-adoption
 * Get content adoption statistics
 *
 * Requires:
 * - Valid JWT (authenticated)
 * - networkId matches JWT
 * - Permission: org:view_content
 */
router.get(
  '/:networkId/dashboard/content-adoption',
  verifyJWT,
  ensureNetworkIsolation,
  apiRateLimiter,
  requirePermission('org:view_content'),
  dashboardController.getContentAdoption,
);

module.exports = router;
