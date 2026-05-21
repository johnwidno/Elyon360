'use strict';

/**
 * Routes: portalRoutes
 * Purpose: Mount church portal endpoints (admin + public)
 * Admin Routes: /api/churches/:churchId/portal/* (authenticated)
 * Public Routes: /:churchDomain/api/portal/* (unauthenticated)
 * Phase: 5a - Church Portal System
 */

const express = require('express');
const router = express.Router();
const portalAdminController = require('../controllers/portalAdminController');
const publicPortalController = require('../controllers/publicPortalController');
const {
  parseChurchDomain,
  requireChurchDomain,
  requireChurchAdmin,
} = require('../middleware/parseChurchDomain');
const { verifyJWT } = require('../middleware/verifyJWT');
const { body } = require('express-validator');

// =============================================================================
// ADMIN ROUTES (Authenticated - Church Admin Only)
// Routes: /api/churches/:churchId/portal/*
// =============================================================================

/**
 * POST /api/churches/:churchId/portal/content
 * Create new content
 */
router.post(
  '/api/churches/:churchId/portal/content',
  verifyJWT,
  requireChurchAdmin,
  [
    body('title').notEmpty().trim().escape(),
    body('contentType').notEmpty().trim().escape(),
    body('visibility')
      .optional()
      .isIn(['public', 'members_only', 'private']),
    body('publish').optional().isBoolean(),
  ],
  portalAdminController.createContent
);

/**
 * GET /api/churches/:churchId/portal/content
 * List content with filters
 */
router.get(
  '/api/churches/:churchId/portal/content',
  verifyJWT,
  requireChurchAdmin,
  portalAdminController.listContent
);

/**
 * PATCH /api/churches/:churchId/portal/content/:contentId
 * Update content
 */
router.patch(
  '/api/churches/:churchId/portal/content/:contentId',
  verifyJWT,
  requireChurchAdmin,
  [body('title').optional().trim().escape()],
  portalAdminController.updateContent
);

/**
 * DELETE /api/churches/:churchId/portal/content/:contentId
 * Archive content
 */
router.delete(
  '/api/churches/:churchId/portal/content/:contentId',
  verifyJWT,
  requireChurchAdmin,
  portalAdminController.deleteContent
);

/**
 * GET /api/churches/:churchId/portal/config
 * Get content type configuration
 */
router.get(
  '/api/churches/:churchId/portal/config',
  verifyJWT,
  requireChurchAdmin,
  portalAdminController.getConfig
);

/**
 * PATCH /api/churches/:churchId/portal/config
 * Update content type configuration and portal settings
 */
router.patch(
  '/api/churches/:churchId/portal/config',
  verifyJWT,
  requireChurchAdmin,
  [body('contentTypes').optional().isArray()],
  portalAdminController.updateConfig
);

/**
 * GET /api/churches/:churchId/portal/analytics
 * Get portal analytics and statistics
 */
router.get(
  '/api/churches/:churchId/portal/analytics',
  verifyJWT,
  requireChurchAdmin,
  portalAdminController.getAnalytics
);

// =============================================================================
// PUBLIC ROUTES (Unauthenticated - Any Visitor)
// Routes: /:churchDomain/api/portal/*
// Uses middleware: parseChurchDomain to extract church from domain
// =============================================================================

/**
 * GET /:churchDomain/api/portal
 * Get portal homepage with branding and featured content
 */
router.get(
  '/:churchDomain/api/portal',
  parseChurchDomain,
  requireChurchDomain,
  publicPortalController.getHomepage
);

/**
 * GET /:churchDomain/api/portal/config
 * Get portal configuration (branding, features, content types)
 */
router.get(
  '/:churchDomain/api/portal/config',
  parseChurchDomain,
  requireChurchDomain,
  publicPortalController.getPortalConfig
);

/**
 * GET /:churchDomain/api/portal/content
 * List content by type with pagination
 */
router.get(
  '/:churchDomain/api/portal/content',
  parseChurchDomain,
  requireChurchDomain,
  publicPortalController.listContentByType
);

/**
 * GET /:churchDomain/api/portal/search
 * Search content
 */
router.get(
  '/:churchDomain/api/portal/search',
  parseChurchDomain,
  requireChurchDomain,
  [body('q').notEmpty().trim().escape()],
  publicPortalController.searchContent
);

/**
 * GET /:churchDomain/api/portal/content/:contentSlug
 * View specific content by slug
 */
router.get(
  '/:churchDomain/api/portal/content/:contentSlug',
  parseChurchDomain,
  requireChurchDomain,
  publicPortalController.viewContent
);

module.exports = router;
