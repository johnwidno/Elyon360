/**
 * JWT Validation Middleware (Phase 2: Security Layer)
 * 
 * Purpose: Extract and validate JWT tokens with churchId/networkId extraction
 * Enforces domain scoping and prevents unauthorized access across organizations
 * 
 * Features:
 * - Extract JWT from Authorization header (Bearer token)
 * - Validate token signature and expiry
 * - Extract churchId/networkId from token claims
 * - Attach user context to request for downstream use
 * - Log authentication events to audit trail
 */

const jwt = require('jsonwebtoken');
const { AuditLog } = require('../models');

/**
 * Verify JWT token and extract claims
 * Attach user context to req.user with churchId, networkId, roles, permissions
 * 
 * Usage: app.use(verifyJWT) or router.use(verifyJWT)
 */
const verifyJWT = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Log authentication failure
      await AuditLog.logEvent({
        eventType: 'login_failure',
        severity: 'warning',
        status: 'failure',
        ipAddress: req.ip || req.connection.remoteAddress,
        request: req,
        errorCode: 'NO_TOKEN',
        description: 'Missing or invalid Authorization header',
      });

      return res.status(401).json({
        success: false,
        message: 'Authorization header required (Bearer token)',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    } catch (jwtError) {
      // Log token verification failure
      await AuditLog.logEvent({
        eventType: 'login_failure',
        severity: 'warning',
        status: 'failure',
        userId: jwtError.message?.includes('expired') ? null : decoded?.userId,
        ipAddress: req.ip || req.connection.remoteAddress,
        request: req,
        errorCode: jwtError.name,
        description: `JWT verification failed: ${jwtError.message}`,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: jwtError.message,
      });
    }

    // Extract user context from token
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      churchId: decoded.churchId || null,
      networkId: decoded.networkId || null,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
      domain: decoded.domain || 'platform', // 'platform', 'network', or 'church'
      iat: decoded.iat,
      exp: decoded.exp,
    };

    // Extract subdomain from hostname if available
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];

    // Store subdomain for subdomain-first login validation
    req.subdomain = subdomain !== 'localhost' && subdomain !== 'api' ? subdomain : null;

    next();
  } catch (error) {
    console.error('JWT verification error:', error);

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
  }
};

/**
 * Validate domain consistency between JWT claims and request context
 * Ensures JWT churchId/networkId matches request parameters
 * 
 * Prevents: Users from accessing other organizations' data
 * 
 * Usage: router.use(validateTokenDomain)
 */
const validateTokenDomain = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Extract domain parameters from request
    const requestChurchId = req.params.churchId ? parseInt(req.params.churchId) : null;
    const requestNetworkId = req.params.networkId ? parseInt(req.params.networkId) : null;

    const tokenChurchId = req.user.churchId;
    const tokenNetworkId = req.user.networkId;

    // Validate church-domain boundary
    if (requestChurchId && tokenChurchId && requestChurchId !== tokenChurchId) {
      // Log domain violation
      await AuditLog.logEvent({
        eventType: 'domain_violation',
        severity: 'error',
        status: 'failure',
        userId: req.user.userId,
        churchId: tokenChurchId,
        ipAddress: req.ip || req.connection.remoteAddress,
        request: req,
        errorCode: 'CHURCH_DOMAIN_MISMATCH',
        description: `Attempted access to church ${requestChurchId} with token for church ${tokenChurchId}`,
        metadata: {
          requestChurchId,
          tokenChurchId,
        },
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied: Church domain mismatch',
      });
    }

    // Validate network-domain boundary
    if (requestNetworkId && tokenNetworkId && requestNetworkId !== tokenNetworkId) {
      // Log domain violation
      await AuditLog.logEvent({
        eventType: 'domain_violation',
        severity: 'error',
        status: 'failure',
        userId: req.user.userId,
        networkId: tokenNetworkId,
        ipAddress: req.ip || req.connection.remoteAddress,
        request: req,
        errorCode: 'NETWORK_DOMAIN_MISMATCH',
        description: `Attempted access to network ${requestNetworkId} with token for network ${tokenNetworkId}`,
        metadata: {
          requestNetworkId,
          tokenNetworkId,
        },
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied: Network domain mismatch',
      });
    }

    next();
  } catch (error) {
    console.error('Domain validation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Domain validation error',
      error: error.message,
    });
  }
};

/**
 * Require specific permission for endpoint access
 * Validates that user has required permission via role assignment
 * 
 * Usage: router.get('/endpoint', requirePermission('resource:action'), handler)
 */
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Check if permission is in user's permission list
      if (!req.user.permissions || !req.user.permissions.includes(requiredPermission)) {
        // Log permission denied
        await AuditLog.logEvent({
          eventType: 'permission_denied',
          severity: 'warning',
          status: 'failure',
          userId: req.user.userId,
          churchId: req.user.churchId,
          networkId: req.user.networkId,
          ipAddress: req.ip || req.connection.remoteAddress,
          request: req,
          errorCode: 'PERMISSION_DENIED',
          description: `User lacks permission: ${requiredPermission}`,
          metadata: {
            requiredPermission,
            userPermissions: req.user.permissions,
          },
        });

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: requiredPermission,
        });
      }

      // Log permission granted
      await AuditLog.logEvent({
        eventType: 'data_access',
        severity: 'info',
        status: 'success',
        userId: req.user.userId,
        churchId: req.user.churchId,
        networkId: req.user.networkId,
        ipAddress: req.ip || req.connection.remoteAddress,
        request: req,
        action: requiredPermission,
        description: `Permission granted: ${requiredPermission}`,
      });

      next();
    } catch (error) {
      console.error('Permission check error:', error);

      return res.status(500).json({
        success: false,
        message: 'Permission check error',
        error: error.message,
      });
    }
  };
};

module.exports = {
  verifyJWT,
  validateTokenDomain,
  requirePermission,
};
