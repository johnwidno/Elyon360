/**
 * Auth Routes (Phase 2: Security Layer)
 * 
 * Purpose: Define all authentication endpoints with security middleware
 * 
 * Features:
 * - Subdomain-first login
 * - Rate limiting
 * - Audit logging
 * - JWT validation
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { verifyJWT, validateTokenDomain } = require('../middleware/verifyJWT');
const { loginRateLimiter, apiRateLimiter } = require('../middleware/rateLimiter');
const { extractSubdomainMiddleware, validateSubdomainConsistency } = require('../middleware/subdomain');

// Apply subdomain extraction to all routes
router.use(extractSubdomainMiddleware);

// ===== PUBLIC AUTH ENDPOINTS (No authentication required) =====

/**
 * POST /api/auth/login-subdomain
 * Subdomain-first login (church.elyon360.app)
 * Rate Limited: 5 attempts per 15 minutes per IP
 */
router.post('/login-subdomain', loginRateLimiter, authController.loginSubdomain);

/**
 * POST /api/auth/login-church
 * Login with explicit churchId
 * Rate Limited: 5 attempts per 15 minutes per IP
 */
router.post('/login-church', loginRateLimiter, authController.loginChurch);

/**
 * POST /api/auth/verify-token
 * Verify token without authentication
 */
router.post('/verify-token', authController.verifyToken);

/**
 * GET /api/auth/rate-limit-status
 * Check rate limit status for current IP
 */
router.get('/rate-limit-status', authController.getRateLimitStatus);

// ===== AUTHENTICATED ENDPOINTS (Require valid JWT) =====

/**
 * POST /api/auth/logout
 * Logout user and invalidate token
 */
router.post('/logout', verifyJWT, authController.logout);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', verifyJWT, authController.getCurrentUser);

/**
 * POST /api/auth/refresh-token
 * Refresh JWT token before expiry
 */
router.post('/refresh-token', verifyJWT, authController.refreshToken);

// Apply general API rate limiter to all remaining routes
router.use(apiRateLimiter);

module.exports = router;
