/**
 * Enhanced Auth Controller (Phase 2: Security Layer)
 * 
 * Purpose: Handle authentication endpoints with security features
 * 
 * Features:
 * - Subdomain-first login (church.elyon360.app)
 * - Email enumeration prevention (no global search fallback)
 * - Rate limiting enforcement
 * - Audit logging for all attempts
 * - JWT token generation with domain context
 */

const { AuditLog } = require('../models');
const authService = require('../services/authService');
const { checkRateLimit } = require('../middleware/rateLimiter');

/**
 * POST /auth/login-subdomain
 * Subdomain-first login flow (PHASE 2 SECURE)
 * 
 * Requires church context via subdomain (prevents email enumeration)
 */
const loginSubdomain = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Get subdomain from request
    let subdomain = req.subdomain;

    // Allow subdomain override in body (for testing/flexibility)
    if (req.body.subdomain) {
      subdomain = req.body.subdomain;
    }

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required',
      });
    }

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: 'Church subdomain required',
        example: 'https://mychurch.elyon360.app/auth/login',
      });
    }

    // Perform subdomain-first login
    const result = await authService.loginSubdomainFirst(
      email.toLowerCase(),
      password,
      subdomain.toLowerCase(),
      ipAddress,
      req
    );

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Return success with token
    return res.status(200).json({
      success: true,
      token: result.token,
      user: result.user,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Subdomain login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Login error',
      error: error.message,
    });
  }
};

/**
 * POST /auth/login-church
 * Standard login with churchId provided
 */
const loginChurch = async (req, res) => {
  try {
    const { email, password, churchId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Validate inputs
    if (!email || !password || !churchId) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and churchId required',
      });
    }

    // Perform login with church context
    const result = await authService.loginWithEmailAndPassword(
      email.toLowerCase(),
      password,
      parseInt(churchId),
      ipAddress,
      req
    );

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Return success with token
    return res.status(200).json({
      success: true,
      token: result.token,
      user: result.user,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Church login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Login error',
      error: error.message,
    });
  }
};

/**
 * POST /auth/logout
 */
const logout = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    await authService.logout(req.user.userId, req.user.churchId, ipAddress, req);

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);

    return res.status(500).json({
      success: false,
      message: 'Logout error',
      error: error.message,
    });
  }
};

/**
 * GET /auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const permissions = await authService.getUserPermissions(req.user.userId, req.user.churchId);

    return res.status(200).json({
      success: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
        churchId: req.user.churchId,
        networkId: req.user.networkId,
        roles: req.user.roles,
        permissions,
        domain: req.user.domain,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);

    return res.status(500).json({
      success: false,
      message: 'Error retrieving user',
      error: error.message,
    });
  }
};

/**
 * POST /auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const permissions = await authService.getUserPermissions(req.user.userId, req.user.churchId);
    const newToken = authService.generateToken(
      {
        id: req.user.userId,
        email: req.user.email,
        churchId: req.user.churchId,
        networkId: req.user.networkId,
        roles: req.user.roles,
      },
      req.user.domain,
      permissions
    );

    return res.status(200).json({
      success: true,
      token: newToken,
      message: 'Token refreshed',
    });
  } catch (error) {
    console.error('Refresh token error:', error);

    return res.status(500).json({
      success: false,
      message: 'Token refresh error',
      error: error.message,
    });
  }
};

/**
 * POST /auth/verify-token
 */
const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token required',
      });
    }

    const jwt = require('jsonwebtoken');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

      return res.status(200).json({
        success: true,
        valid: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          churchId: decoded.churchId,
          networkId: decoded.networkId,
          domain: decoded.domain,
        },
      });
    } catch (jwtError) {
      return res.status(200).json({
        success: true,
        valid: false,
        message: jwtError.message,
      });
    }
  } catch (error) {
    console.error('Verify token error:', error);

    return res.status(500).json({
      success: false,
      message: 'Token verification error',
      error: error.message,
    });
  }
};

/**
 * GET /auth/rate-limit-status
 */
const getRateLimitStatus = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const key = `rate-limit-login:${ipAddress}`;

    const status = checkRateLimit(key);

    return res.status(200).json({
      success: true,
      rateLimitStatus: {
        isLimited: status.isLimited,
        remaining: status.remaining === Infinity ? 'unlimited' : status.remaining,
        resetTime: status.resetTime,
      },
    });
  } catch (error) {
    console.error('Get rate limit status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Error retrieving rate limit status',
    });
  }
};

// Export all controllers
module.exports = {
  loginSubdomain,
  loginChurch,
  logout,
  getCurrentUser,
  refreshToken,
  verifyToken,
  getRateLimitStatus,
};
