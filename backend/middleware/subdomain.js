/**
 * Subdomain Extraction Middleware (Phase 2: Security Layer)
 * 
 * Purpose: Support subdomain-first login pattern (church.elyon360.app → churchId extracted from domain)
 * Enables single sign-on with church-specific domains
 * 
 * Features:
 * - Extract church identifier from subdomain
 * - Resolve subdomain to churchId
 * - Attach subdomain and churchId to request context
 * - Enforce subdomain consistency with JWT claims (if authenticated)
 */

const { Church } = require('../models');

/**
 * Extract subdomain from request host
 * 
 * Examples:
 * - 'myChurch.elyon360.app' → 'myChurch'
 * - 'church-name.elyon360.app' → 'church-name'
 * - 'localhost:5000' → null
 * - 'api.elyon360.app' → null (reserved)
 * 
 * @param {string} host - Request host header value
 * @returns {string|null} Subdomain or null
 */
const extractSubdomain = (host) => {
  if (!host) return null;

  // Split host by dots
  const parts = host.split('.');

  // Single part (localhost) - no subdomain
  if (parts.length === 1) return null;

  // Get first part as potential subdomain
  const subdomain = parts[0].toLowerCase();

  // Reserved subdomains
  const reserved = ['www', 'api', 'admin', 'mail', 'ftp'];
  if (reserved.includes(subdomain)) return null;

  // Exclude port numbers
  if (/^\d+$/.test(subdomain)) return null;

  return subdomain;
};

/**
 * Resolve subdomain to churchId
 * Handles multiple formats:
 * - Church slug (e.g., 'grace-church' → Church with slug='grace-church')
 * - Church custom domain (e.g., 'gracechurch' → Church with customDomain='gracechurch.elyon360.app')
 * 
 * @param {string} subdomain - Subdomain to resolve
 * @returns {Promise<Object|null>} Church object or null if not found
 */
const resolveSubdomainToChurch = async (subdomain) => {
  if (!subdomain) return null;

  try {
    // Try to find church by slug (subdomain is slug)
    let church = await Church.findOne({
      where: {
        slug: subdomain,
      },
    });

    if (church) {
      return church;
    }

    // Try to find church by custom domain
    // Custom domain format: subdomain.elyon360.app
    const customDomain = `${subdomain}.elyon360.app`;
    church = await Church.findOne({
      where: {
        customDomain,
      },
    });

    return church || null;
  } catch (error) {
    console.error('Error resolving subdomain to church:', error);
    return null;
  }
};

/**
 * Extract and resolve subdomain middleware
 * Attaches resolved church context to request
 * 
 * Usage: app.use(extractSubdomainMiddleware)
 */
const extractSubdomainMiddleware = async (req, res, next) => {
  try {
    const host = req.get('host') || '';
    const subdomain = extractSubdomain(host);

    // Attach subdomain to request
    req.subdomain = subdomain;
    req.churchFromSubdomain = null;
    req.churchIdFromSubdomain = null;

    // If subdomain exists, resolve to church
    if (subdomain) {
      const church = await resolveSubdomainToChurch(subdomain);

      if (church) {
        req.churchFromSubdomain = church;
        req.churchIdFromSubdomain = church.id;
      }
    }

    next();
  } catch (error) {
    console.error('Subdomain extraction error:', error);
    // Don't block request on middleware error
    next();
  }
};

/**
 * Validate subdomain-JWT consistency
 * Ensures authenticated user is accessing their church's subdomain
 * 
 * Usage: router.use(validateSubdomainConsistency)
 */
const validateSubdomainConsistency = async (req, res, next) => {
  try {
    // Only validate if both subdomain and JWT exist
    if (!req.subdomain || !req.user) {
      return next();
    }

    // Get church from subdomain
    const churchFromSubdomain = await resolveSubdomainToChurch(req.subdomain);

    if (!churchFromSubdomain) {
      // Subdomain doesn't resolve to valid church
      return next(); // Let other handlers decide
    }

    // Check if JWT churchId matches subdomain churchId
    if (req.user.churchId && req.user.churchId !== churchFromSubdomain.id) {
      // Log subdomain mismatch
      const { AuditLog } = require('../models');
      await AuditLog.logEvent({
        eventType: 'domain_violation',
        severity: 'warning',
        status: 'failure',
        userId: req.user.userId,
        churchId: req.user.churchId,
        ipAddress: req.ip || req.connection.remoteAddress,
        request: req,
        errorCode: 'SUBDOMAIN_JWT_MISMATCH',
        description: `User from church ${req.user.churchId} accessed subdomain for church ${churchFromSubdomain.id}`,
        metadata: {
          userChurchId: req.user.churchId,
          subdomainChurchId: churchFromSubdomain.id,
          subdomain: req.subdomain,
        },
      });

      return res.status(403).json({
        success: false,
        message: 'Subdomain does not match your church',
      });
    }

    next();
  } catch (error) {
    console.error('Subdomain consistency validation error:', error);
    // Don't block request on validation error
    next();
  }
};

/**
 * Require valid subdomain
 * Ensures request is accessing through valid church subdomain
 * 
 * Usage: router.use(requireValidSubdomain)
 */
const requireValidSubdomain = async (req, res, next) => {
  try {
    if (!req.subdomain) {
      return res.status(400).json({
        success: false,
        message: 'Church subdomain required',
        example: 'https://yourchurch.elyon360.app',
      });
    }

    const church = await resolveSubdomainToChurch(req.subdomain);

    if (!church) {
      return res.status(404).json({
        success: false,
        message: 'Church not found',
      });
    }

    // Attach resolved church to request
    req.churchFromSubdomain = church;
    req.churchIdFromSubdomain = church.id;

    next();
  } catch (error) {
    console.error('Subdomain validation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Subdomain validation error',
      error: error.message,
    });
  }
};

/**
 * Require subdomain match or authentication
 * Either access through church subdomain OR via valid JWT with matching churchId
 * 
 * Usage: router.use(requireSubdomainOrAuth)
 */
const requireSubdomainOrAuth = async (req, res, next) => {
  try {
    let validChurchId = null;

    // Check subdomain
    if (req.subdomain) {
      const church = await resolveSubdomainToChurch(req.subdomain);
      if (church) {
        validChurchId = church.id;
        req.churchFromSubdomain = church;
      }
    }

    // Check JWT
    if (req.user && req.user.churchId) {
      if (validChurchId && validChurchId !== req.user.churchId) {
        // Subdomain and JWT churchId mismatch
        return res.status(403).json({
          success: false,
          message: 'Church context mismatch between subdomain and authentication',
        });
      }
      validChurchId = req.user.churchId;
    }

    // Must have either valid subdomain or valid JWT
    if (!validChurchId) {
      return res.status(401).json({
        success: false,
        message: 'Church context required (via subdomain or JWT)',
      });
    }

    req.churchIdFromSubdomain = validChurchId;
    next();
  } catch (error) {
    console.error('Subdomain/Auth validation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Context validation error',
      error: error.message,
    });
  }
};

module.exports = {
  extractSubdomain,
  resolveSubdomainToChurch,
  extractSubdomainMiddleware,
  validateSubdomainConsistency,
  requireValidSubdomain,
  requireSubdomainOrAuth,
};
