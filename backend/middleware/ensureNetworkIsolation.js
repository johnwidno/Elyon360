/**
 * Network Isolation Middleware
 * Ensures organization-level (network) requests are authorized for specific network
 *
 * Usage: app.use('/api/networks/:networkId', ensureNetworkIsolation, handler)
 *
 * Validates:
 * - User is authenticated (has valid JWT)
 * - User has networkId in JWT claims
 * - User's networkId matches request networkId
 * - User has org-level roles (not church-level)
 */

const { AuditLog } = require('../models');

/**
 * ensureNetworkIsolation(req, res, next)
 * Middleware to verify network authorization
 *
 * Checks:
 * 1. JWT exists and user is authenticated
 * 2. URL has :networkId parameter
 * 3. JWT networkId matches URL networkId
 * 4. User has org-level role (networkId NOT null)
 * 5. User churchId is NULL (org-level only)
 *
 * If validation fails: 403 Forbidden
 * Logs failed attempts as security events
 */
function ensureNetworkIsolation(req, res, next) {
  try {
    // Check authentication
    if (!req.user) {
      console.warn('[ensureNetworkIsolation] Missing req.user - not authenticated');
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'NOT_AUTHENTICATED',
      });
    }

    // Extract networkId from URL parameter
    const requestNetworkId = req.params.networkId;
    if (!requestNetworkId) {
      console.warn('[ensureNetworkIsolation] Missing networkId in URL parameters');
      return res.status(400).json({
        error: 'Bad Request',
        code: 'MISSING_NETWORK_ID',
      });
    }

    // Extract networkId from JWT claims
    const userNetworkId = req.user.networkId;

    // Validation 1: User must have networkId (org-level role)
    if (!userNetworkId) {
      console.warn(
        `[ensureNetworkIsolation] User ${req.user.userId} has no networkId (church-level only)`,
      );

      // Log security event
      AuditLog.logEvent({
        eventType: 'unauthorized_access',
        severity: 'warning',
        status: 'failure',
        userId: req.user.userId,
        churchId: req.user.churchId || null,
        networkId: null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl,
        errorMessage: 'Network access denied: user has no networkId (church-level only)',
        errorCode: 'NO_NETWORK_ID',
        description: `User attempted network access but has no org-level role`,
        request: req,
      }).catch((err) => {
        console.error('[ensureNetworkIsolation] Audit log failed:', err.message);
      });

      return res.status(403).json({
        error: 'Forbidden',
        code: 'NO_NETWORK_ROLE',
        message: 'You do not have organization-level access',
      });
    }

    // Validation 2: User's networkId must match request networkId
    if (parseInt(userNetworkId) !== parseInt(requestNetworkId)) {
      console.warn(
        `[ensureNetworkIsolation] Network mismatch: user networkId=${userNetworkId}, request networkId=${requestNetworkId}`,
      );

      // Log security event (cross-network access attempt)
      AuditLog.logEvent({
        eventType: 'cross_domain_access',
        severity: 'warning',
        status: 'failure',
        userId: req.user.userId,
        churchId: req.user.churchId || null,
        networkId: userNetworkId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl,
        resourceType: 'Network',
        resourceId: requestNetworkId,
        action: 'access',
        errorMessage: `Network mismatch: user networkId (${userNetworkId}) does not match request networkId (${requestNetworkId})`,
        errorCode: 'NETWORK_MISMATCH',
        description: `User from network ${userNetworkId} attempted to access network ${requestNetworkId}`,
        request: req,
      }).catch((err) => {
        console.error('[ensureNetworkIsolation] Audit log failed:', err.message);
      });

      return res.status(403).json({
        error: 'Forbidden',
        code: 'NETWORK_MISMATCH',
        message: 'You do not have access to this network',
      });
    }

    // Validation 3: User's churchId should be NULL (org-level role)
    if (req.user.churchId) {
      console.warn(
        `[ensureNetworkIsolation] User ${req.user.userId} has churchId (church-level user accessing org endpoint)`,
      );

      // This is not necessarily a breach (user could have both roles)
      // But log it for monitoring
      AuditLog.logEvent({
        eventType: 'permission_denied',
        severity: 'info',
        status: 'failure',
        userId: req.user.userId,
        churchId: req.user.churchId,
        networkId: userNetworkId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl,
        errorMessage: 'Church-level user attempted network operation',
        errorCode: 'CHURCH_LEVEL_ONLY',
        description: `User has churchId set; network operations restricted to org-level users only`,
        request: req,
      }).catch((err) => {
        console.error('[ensureNetworkIsolation] Audit log failed:', err.message);
      });

      return res.status(403).json({
        error: 'Forbidden',
        code: 'CHURCH_LEVEL_ONLY',
        message: 'This operation is restricted to organization-level users',
      });
    }

    // ✅ All validations passed
    console.log(
      `[ensureNetworkIsolation] ✅ User ${req.user.userId} authorized for network ${requestNetworkId}`,
    );

    // Attach networkId to request for downstream handlers
    req.networkId = requestNetworkId;

    next();
  } catch (error) {
    console.error('[ensureNetworkIsolation] Unexpected error:', error);

    // Log unhandled error
    if (req.user) {
      AuditLog.logEvent({
        eventType: 'api_error',
        severity: 'error',
        status: 'failure',
        userId: req.user.userId,
        churchId: req.user.churchId || null,
        networkId: req.user.networkId || null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl,
        errorMessage: error.message,
        errorCode: 'NETWORK_ISOLATION_ERROR',
        description: 'Unhandled error in network isolation middleware',
        request: req,
      }).catch((err) => {
        console.error('[ensureNetworkIsolation] Audit log failed:', err.message);
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      code: 'NETWORK_ISOLATION_ERROR',
    });
  }
}

/**
 * ensureChurchIsolation(req, res, next)
 * Middleware to verify church authorization (alternative for church-level endpoints)
 *
 * Checks:
 * 1. JWT exists and user is authenticated
 * 2. URL has :churchId parameter
 * 3. JWT churchId matches URL churchId
 */
function ensureChurchIsolation(req, res, next) {
  try {
    // Check authentication
    if (!req.user) {
      console.warn('[ensureChurchIsolation] Missing req.user - not authenticated');
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'NOT_AUTHENTICATED',
      });
    }

    // Extract churchId from URL parameter
    const requestChurchId = req.params.churchId;
    if (!requestChurchId) {
      console.warn('[ensureChurchIsolation] Missing churchId in URL parameters');
      return res.status(400).json({
        error: 'Bad Request',
        code: 'MISSING_CHURCH_ID',
      });
    }

    // Extract churchId from JWT claims
    const userChurchId = req.user.churchId;

    // Validation 1: User must have churchId (church-level role)
    if (!userChurchId) {
      console.warn(
        `[ensureChurchIsolation] User ${req.user.userId} has no churchId (org-level only)`,
      );

      // Log security event
      AuditLog.logEvent({
        eventType: 'unauthorized_access',
        severity: 'warning',
        status: 'failure',
        userId: req.user.userId,
        churchId: null,
        networkId: req.user.networkId || null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl,
        errorMessage: 'Church access denied: user has no churchId (org-level only)',
        errorCode: 'NO_CHURCH_ID',
        description: `User attempted church access but has no church-level role`,
        request: req,
      }).catch((err) => {
        console.error('[ensureChurchIsolation] Audit log failed:', err.message);
      });

      return res.status(403).json({
        error: 'Forbidden',
        code: 'NO_CHURCH_ROLE',
        message: 'You do not have church-level access',
      });
    }

    // Validation 2: User's churchId must match request churchId
    if (parseInt(userChurchId) !== parseInt(requestChurchId)) {
      console.warn(
        `[ensureChurchIsolation] Church mismatch: user churchId=${userChurchId}, request churchId=${requestChurchId}`,
      );

      // Log security event (cross-church access attempt)
      AuditLog.logEvent({
        eventType: 'cross_domain_access',
        severity: 'warning',
        status: 'failure',
        userId: req.user.userId,
        churchId: userChurchId,
        networkId: req.user.networkId || null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl,
        resourceType: 'Church',
        resourceId: requestChurchId,
        action: 'access',
        errorMessage: `Church mismatch: user churchId (${userChurchId}) does not match request churchId (${requestChurchId})`,
        errorCode: 'CHURCH_MISMATCH',
        description: `User from church ${userChurchId} attempted to access church ${requestChurchId}`,
        request: req,
      }).catch((err) => {
        console.error('[ensureChurchIsolation] Audit log failed:', err.message);
      });

      return res.status(403).json({
        error: 'Forbidden',
        code: 'CHURCH_MISMATCH',
        message: 'You do not have access to this church',
      });
    }

    // ✅ All validations passed
    console.log(
      `[ensureChurchIsolation] ✅ User ${req.user.userId} authorized for church ${requestChurchId}`,
    );

    // Attach churchId to request for downstream handlers
    req.churchId = requestChurchId;

    next();
  } catch (error) {
    console.error('[ensureChurchIsolation] Unexpected error:', error);

    // Log unhandled error
    if (req.user) {
      AuditLog.logEvent({
        eventType: 'api_error',
        severity: 'error',
        status: 'failure',
        userId: req.user.userId,
        churchId: req.user.churchId || null,
        networkId: req.user.networkId || null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestMethod: req.method,
        requestPath: req.originalUrl,
        errorMessage: error.message,
        errorCode: 'CHURCH_ISOLATION_ERROR',
        description: 'Unhandled error in church isolation middleware',
        request: req,
      }).catch((err) => {
        console.error('[ensureChurchIsolation] Audit log failed:', err.message);
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      code: 'CHURCH_ISOLATION_ERROR',
    });
  }
}

module.exports = {
  ensureNetworkIsolation,
  ensureChurchIsolation,
};
