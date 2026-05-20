/**
 * Rate Limiting Middleware (Phase 2: Security Layer)
 * 
 * Purpose: Prevent brute force attacks and API abuse
 * 
 * Features:
 * - In-memory rate limiting (can be upgraded to Redis)
 * - Per-IP and per-user rate limiting
 * - Separate strict limits for login endpoint
 * - Audit logging of rate limit violations
 * - Configurable time windows and request limits
 */

const { AuditLog } = require('../models');

// In-memory store for rate limiting
// Format: { 'key': { count: number, resetTime: timestamp } }
const rateLimitStore = new Map();

/**
 * Clean up expired entries from rate limit store
 */
const cleanupStore = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
};

/**
 * Generic rate limit middleware
 * 
 * @param {Object} options - Configuration
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Max requests per window
 * @param {string} options.keyPrefix - Prefix for rate limit key
 * @param {boolean} options.skipSuccessfulRequests - Don't count successful requests
 * @param {Function} options.keyGenerator - Custom key generator function
 * @param {string} options.message - Custom error message
 * 
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    keyPrefix = 'rate-limit',
    skipSuccessfulRequests = false,
    keyGenerator = (req) => `${keyPrefix}:${req.ip}`,
    message = 'Too many requests, please try again later',
  } = options;

  return async (req, res, next) => {
    try {
      // Generate rate limit key
      const key = keyGenerator(req);
      const now = Date.now();

      // Clean up old entries periodically
      if (Math.random() < 0.01) {
        cleanupStore();
      }

      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);

      if (!entry || entry.resetTime < now) {
        entry = {
          count: 0,
          resetTime: now + windowMs,
          firstRequestTime: now,
        };
      }

      // Increment request count
      entry.count++;

      // Store updated entry
      rateLimitStore.set(key, entry);

      // Add rate limit info to response headers
      res.set({
        'RateLimit-Limit': maxRequests,
        'RateLimit-Remaining': Math.max(0, maxRequests - entry.count),
        'RateLimit-Reset': Math.ceil(entry.resetTime / 1000),
      });

      // Check if limit exceeded
      if (entry.count > maxRequests) {
        // Log rate limit exceeded
        await AuditLog.logEvent({
          eventType: 'rate_limit_exceeded',
          severity: 'warning',
          status: 'failure',
          userId: req.user?.userId,
          ipAddress: req.ip || req.connection.remoteAddress,
          request: req,
          errorCode: 'RATE_LIMIT_EXCEEDED',
          description: `Rate limit exceeded for key: ${key}`,
          metadata: {
            requests: entry.count,
            limit: maxRequests,
            window: windowMs,
          },
        });

        return res.status(429).json({
          success: false,
          message,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Don't block request on rate limiter error
      next();
    }
  };
};

/**
 * General API rate limiter
 * Default: 100 requests per 15 minutes per IP
 */
const apiRateLimiter = createRateLimiter({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  keyPrefix: 'rate-limit-api',
  message: 'Too many API requests, please try again later',
});

/**
 * Login rate limiter
 * Stricter limits: 5 attempts per 15 minutes per IP
 */
const loginRateLimiter = createRateLimiter({
  windowMs: (process.env.LOGIN_RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  maxRequests: process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || 5,
  keyPrefix: 'rate-limit-login',
  keyGenerator: (req) => `rate-limit-login:${req.ip}`,
  message: 'Too many login attempts, please try again later',
});

/**
 * Password reset rate limiter
 * Moderate limits: 3 attempts per hour per email
 */
const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  keyPrefix: 'rate-limit-password',
  keyGenerator: (req) => `rate-limit-password:${req.body?.email || req.ip}`,
  message: 'Too many password reset attempts, please try again later',
});

/**
 * User-based rate limiter
 * Prevents single user from overwhelming API
 * Default: 1000 requests per hour per user
 */
const userRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 1000,
  keyPrefix: 'rate-limit-user',
  keyGenerator: (req) => `rate-limit-user:${req.user?.userId || req.ip}`,
  message: 'User rate limit exceeded',
});

/**
 * Check if user/IP is currently rate limited
 * Used for additional security checks
 * 
 * @param {string} key - Rate limit key
 * @returns {Object} { isLimited: boolean, remaining: number, resetTime: timestamp }
 */
const checkRateLimit = (key) => {
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < Date.now()) {
    return {
      isLimited: false,
      remaining: Infinity,
      resetTime: null,
    };
  }

  return {
    isLimited: true,
    remaining: Math.max(0, entry.count),
    resetTime: entry.resetTime,
  };
};

/**
 * Reset rate limit for specific key
 * Useful for admin override or security incidents
 * 
 * @param {string} key - Rate limit key to reset
 */
const resetRateLimit = (key) => {
  rateLimitStore.delete(key);
};

/**
 * Clear all rate limits
 * Useful for testing or emergency situations
 */
const clearAllRateLimits = () => {
  rateLimitStore.clear();
};

module.exports = {
  createRateLimiter,
  apiRateLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
  userRateLimiter,
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
};
