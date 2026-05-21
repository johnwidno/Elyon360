'use strict';

/**
 * Middleware: parseChurchDomain
 * Purpose: Extract church domain from request and resolve to churchId for public portal routes
 * Usage: app.use(parseChurchDomain) for public portal routes
 * Features: Subdomain extraction, custom domain support, caching, error handling
 * Phase: 5a - Church Portal System
 */

const db = require('../models');

/**
 * Cache for domain -> churchId lookups
 * { domain: { churchId, portalSettings, church } }
 * TTL: 5 minutes
 */
const domainCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clear all cached domains
 */
function clearDomainCache() {
  domainCache.clear();
}

/**
 * Clear a specific domain from cache
 */
function clearDomainFromCache(domain) {
  domainCache.delete(domain.toLowerCase());
}

/**
 * Get cached domain lookup
 * Params: domain
 * Returns: { churchId, portalSettings, church } or null if expired/not cached
 */
function getCachedDomain(domain) {
  const cached = domainCache.get(domain.toLowerCase());
  if (!cached) return null;

  // Check if cache has expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    domainCache.delete(domain.toLowerCase());
    return null;
  }

  return cached.data;
}

/**
 * Cache a domain lookup
 * Params: domain, data = { churchId, portalSettings, church }
 */
function cacheDomain(domain, data) {
  domainCache.set(domain.toLowerCase(), {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Extract domain from request
 * Handles: subdomain (portal.elyonsys.com) and custom domain (portal.com)
 * Params: req (Express request)
 * Returns: { domain, type } where type = 'subdomain' | 'custom' | 'unknown'
 */
function extractDomainFromRequest(req) {
  const host = req.get('host') || '';
  const [hostname] = host.split(':'); // Remove port if present

  // Check for subdomain pattern (*.elyonsys.com)
  const baseDomain = process.env.PORTAL_BASE_DOMAIN || 'elyonsys.com';
  const subdomainPattern = new RegExp(`^(.+)\\.${baseDomain}$`, 'i');
  const subdomainMatch = hostname.match(subdomainPattern);

  if (subdomainMatch) {
    return {
      domain: subdomainMatch[1].toLowerCase(),
      type: 'subdomain',
      fullHost: hostname,
    };
  }

  // For custom domains, just return the hostname as-is
  if (hostname !== baseDomain && hostname !== `www.${baseDomain}`) {
    return {
      domain: hostname.toLowerCase(),
      type: 'custom',
      fullHost: hostname,
    };
  }

  // Main domain or www.maindomain
  return {
    domain: hostname.toLowerCase(),
    type: 'unknown',
    fullHost: hostname,
  };
}

/**
 * Main middleware: parseChurchDomain
 * Resolves church domain to churchId and attaches to req.church
 */
async function parseChurchDomain(req, res, next) {
  try {
    const { domain, type } = extractDomainFromRequest(req);

    // Skip if on main domain (not a church portal)
    const baseDomain = process.env.PORTAL_BASE_DOMAIN || 'elyonsys.com';
    if (type === 'unknown') {
      // Main platform, not a church portal
      req.church = null;
      req.churchDomain = null;
      return next();
    }

    // Check cache first
    const cached = getCachedDomain(domain);
    if (cached) {
      req.church = cached.church;
      req.churchDomain = cached.domain;
      req.portalSettings = cached.portalSettings;
      return next();
    }

    // Look up domain in database
    const portalSettings = await db.ChurchPortalSettings.findByDomain(domain);

    if (!portalSettings) {
      // Domain not found
      return res.status(404).json({
        error: 'Church portal not found',
        domain,
      });
    }

    // Fetch full church data
    const church = await db.Church.findByPk(portalSettings.churchId, {
      attributes: ['id', 'name', 'email', 'phone', 'address', 'status'],
    });

    if (!church || church.status !== 'active') {
      return res.status(404).json({
        error: 'Church portal is inactive',
        churchId: portalSettings.churchId,
      });
    }

    // Cache the result
    const cacheData = {
      churchId: church.id,
      church: church.toJSON(),
      domain: domain,
      portalSettings: portalSettings.toJSON(),
    };
    cacheDomain(domain, cacheData);

    // Attach to request
    req.church = church;
    req.churchDomain = domain;
    req.portalSettings = portalSettings;
    req.churchId = church.id;

    next();
  } catch (error) {
    console.error('parseChurchDomain error:', error);
    return res.status(500).json({
      error: 'Error resolving church domain',
      message: error.message,
    });
  }
}

/**
 * Middleware: Verify church is resolved (non-null)
 * Use after parseChurchDomain on public portal routes that require a valid church
 */
function requireChurchDomain(req, res, next) {
  if (!req.churchId || !req.church) {
    return res.status(404).json({
      error: 'Church not found',
    });
  }
  next();
}

/**
 * Middleware: Verify authentication & church affiliation
 * Use on portal admin routes to verify user is an admin of the church
 */
async function requireChurchAdmin(req, res, next) {
  try {
    const churchId = req.params.churchId;

    // Verify churchId matches authenticated user's church
    if (!req.user || req.user.churchId !== parseInt(churchId)) {
      return res.status(403).json({
        error: 'You do not have permission to manage this church portal',
      });
    }

    // Verify user has admin role
    const hasAdminRole = req.user.roles && req.user.roles.includes('admin');
    if (!hasAdminRole) {
      return res.status(403).json({
        error: 'Only administrators can manage church portal',
      });
    }

    // Attach church to request
    const church = await db.Church.findByPk(churchId);
    if (!church) {
      return res.status(404).json({
        error: 'Church not found',
      });
    }

    req.church = church;
    next();
  } catch (error) {
    console.error('requireChurchAdmin error:', error);
    return res.status(500).json({
      error: 'Error verifying church admin permissions',
      message: error.message,
    });
  }
}

/**
 * Utility: Get portal URL for a church
 * Params: churchId
 * Returns: URL string or null
 */
async function getChurchPortalUrl(churchId) {
  try {
    const settings = await db.ChurchPortalSettings.findOne({
      where: { churchId },
    });

    if (!settings) return null;

    const baseDomain = process.env.PORTAL_BASE_DOMAIN || 'elyonsys.com';
    return settings.getPortalUrl(baseDomain);
  } catch (error) {
    console.error('getChurchPortalUrl error:', error);
    return null;
  }
}

/**
 * Utility: Redirect to church portal
 * Params: res (Express response), churchId
 */
async function redirectToChurchPortal(res, churchId) {
  const url = await getChurchPortalUrl(churchId);
  if (url) {
    return res.redirect(`${url}/`);
  }
  return res.status(404).json({
    error: 'Church portal URL not found',
  });
}

module.exports = {
  parseChurchDomain,
  requireChurchDomain,
  requireChurchAdmin,
  getChurchPortalUrl,
  redirectToChurchPortal,
  clearDomainCache,
  clearDomainFromCache,
  // Exports for testing
  extractDomainFromRequest,
  getCachedDomain,
  cacheDomain,
};
