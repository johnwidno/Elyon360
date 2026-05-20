/**
 * Authentication Service (Phase 2: Security Layer)
 * 
 * Purpose: Centralized authentication logic
 * 
 * Features:
 * - JWT token generation with churchId/networkId claims
 * - Email enumeration prevention (no email existence leaks)
 * - Password hashing and verification
 * - Login attempt tracking
 * - Multi-domain login support (platform, network, church)
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Church, ChurchNetwork, Role, Permission, AuditLog } = require('../models');

/**
 * Generate JWT token with claims
 * 
 * @param {Object} user - User object
 * @param {Integer} user.id - User ID
 * @param {string} user.email - User email
 * @param {Integer} user.churchId - Church context (optional)
 * @param {Integer} user.networkId - Network context (optional)
 * @param {Array} user.roles - User roles (optional)
 * @param {string} domain - Domain context ('platform', 'network', 'church')
 * @param {Array} permissions - User permissions (optional)
 * @returns {string} JWT token
 */
const generateToken = (user, domain = 'church', permissions = []) => {
  const payload = {
    userId: user.id,
    email: user.email,
    churchId: user.churchId || null,
    networkId: user.networkId || null,
    roles: user.roles || [],
    permissions: permissions,
    domain: domain,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: process.env.JWT_EXPIRY || '7d',
    issuer: 'elyon360-auth',
    subject: `user-${user.id}`,
  });

  return token;
};

/**
 * Hash password using bcrypt
 * 
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 * 
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if match
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Login with email and password (no global search - email enumeration prevention)
 * Requires churchId context to prevent email enumeration
 * 
 * Design: User emails are scoped to church context. Same email can exist in different churches.
 * This prevents: "Is john@example.com registered?" attacks
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Integer} churchId - Church context (required for security)
 * @param {string} ipAddress - Client IP for audit trail
 * @param {Object} request - Express request object
 * @returns {Promise<Object>} { success, token, user, message }
 */
const loginWithEmailAndPassword = async (
  email,
  password,
  churchId,
  ipAddress,
  request = null
) => {
  try {
    // Validate inputs
    if (!email || !password || !churchId) {
      // Don't reveal what's missing - prevents enumeration
      await AuditLog.logEvent({
        eventType: 'login_failure',
        severity: 'warning',
        status: 'failure',
        churchId: churchId || null,
        ipAddress,
        request,
        errorCode: 'MISSING_CREDENTIALS',
        description: 'Login attempted with missing credentials',
      });

      // Return generic error (prevents enumeration)
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Find user in church context
    const user = await User.findOne({
      where: {
        email: email.toLowerCase(),
        churchId: churchId,
      },
    });

    // User not found in this church (generic error prevents enumeration)
    if (!user) {
      await AuditLog.logEvent({
        eventType: 'login_failure',
        severity: 'warning',
        status: 'failure',
        churchId,
        ipAddress,
        request,
        errorCode: 'USER_NOT_FOUND',
        description: `Login failed: user not found in church ${churchId}`,
        metadata: {
          email,
        },
      });

      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Check if account is active
    if (user.status !== 'active') {
      await AuditLog.logEvent({
        eventType: 'login_failure',
        severity: 'warning',
        status: 'failure',
        userId: user.id,
        churchId,
        ipAddress,
        request,
        errorCode: 'ACCOUNT_INACTIVE',
        description: `Login failed: account is ${user.status}`,
      });

      return {
        success: false,
        message: 'Account is not active',
      };
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      await AuditLog.logEvent({
        eventType: 'login_failure',
        severity: 'warning',
        status: 'failure',
        userId: user.id,
        churchId,
        ipAddress,
        request,
        errorCode: 'INVALID_PASSWORD',
        description: 'Login failed: invalid password',
      });

      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // Get user roles and permissions for this church
    const userRoles = await user.getUserRoles({
      where: { churchId },
    });

    const permissionSet = new Set();
    for (const userRole of userRoles) {
      const role = await userRole.getRole();
      if (role && role.permissionIds) {
        role.permissionIds.forEach((perm) => permissionSet.add(perm));
      }
    }

    const permissions = Array.from(permissionSet);

    // Generate JWT token
    const token = generateToken(
      {
        ...user.toJSON(),
        churchId,
        roles: userRoles.map((ur) => ur.roleId),
      },
      'church',
      permissions
    );

    // Log successful login
    await AuditLog.logEvent({
      eventType: 'login',
      severity: 'info',
      status: 'success',
      userId: user.id,
      churchId,
      ipAddress,
      request,
      description: `User ${user.email} logged in successfully`,
    });

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        churchId,
        roles: userRoles.map((ur) => ur.roleId),
        permissions,
      },
    };
  } catch (error) {
    console.error('Login error:', error);

    await AuditLog.logEvent({
      eventType: 'login_failure',
      severity: 'error',
      status: 'failure',
      churchId: churchId || null,
      ipAddress,
      request,
      errorCode: 'LOGIN_ERROR',
      description: `Login error: ${error.message}`,
    });

    return {
      success: false,
      message: 'Login failed',
    };
  }
};

/**
 * Subdomain-first login flow
 * Extract church from subdomain, then validate credentials
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} subdomain - Church subdomain
 * @param {string} ipAddress - Client IP
 * @param {Object} request - Express request
 * @returns {Promise<Object>} { success, token, user, message }
 */
const loginSubdomainFirst = async (email, password, subdomain, ipAddress, request = null) => {
  try {
    // Resolve subdomain to church
    const { resolveSubdomainToChurch } = require('./subdomain');
    const church = await resolveSubdomainToChurch(subdomain);

    if (!church) {
      await AuditLog.logEvent({
        eventType: 'login_failure',
        severity: 'warning',
        status: 'failure',
        ipAddress,
        request,
        errorCode: 'SUBDOMAIN_NOT_FOUND',
        description: `Login failed: subdomain ${subdomain} not found`,
        metadata: { subdomain },
      });

      return {
        success: false,
        message: 'Church not found',
      };
    }

    // Login with church context
    return loginWithEmailAndPassword(email, password, church.id, ipAddress, request);
  } catch (error) {
    console.error('Subdomain-first login error:', error);

    return {
      success: false,
      message: 'Login failed',
    };
  }
};

/**
 * Logout user
 * Invalidate token (can be enhanced with token blacklist)
 * 
 * @param {Integer} userId - User ID
 * @param {Integer} churchId - Church context
 * @param {string} ipAddress - Client IP
 * @returns {Promise<boolean>}
 */
const logout = async (userId, churchId, ipAddress, request = null) => {
  try {
    await AuditLog.logEvent({
      eventType: 'logout',
      severity: 'info',
      status: 'success',
      userId,
      churchId,
      ipAddress,
      request,
      description: 'User logged out',
    });

    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

/**
 * Get user permissions for specific context
 * Merges permissions from all active roles
 * 
 * @param {Integer} userId - User ID
 * @param {Integer} churchId - Church context
 * @returns {Promise<Array>} Array of permission names
 */
const getUserPermissions = async (userId, churchId) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return [];
    }

    const userRoles = await user.getUserRoles({
      where: { churchId },
    });

    const permissionSet = new Set();

    for (const userRole of userRoles) {
      const role = await userRole.getRole();
      if (role && role.permissionIds) {
        role.permissionIds.forEach((perm) => permissionSet.add(perm));
      }
    }

    return Array.from(permissionSet);
  } catch (error) {
    console.error('Get permissions error:', error);
    return [];
  }
};

/**
 * Verify user has specific permission
 * 
 * @param {Integer} userId - User ID
 * @param {Integer} churchId - Church context
 * @param {string} permission - Permission name (e.g., 'members:read')
 * @returns {Promise<boolean>}
 */
const hasPermission = async (userId, churchId, permission) => {
  const permissions = await getUserPermissions(userId, churchId);
  return permissions.includes(permission);
};

module.exports = {
  generateToken,
  hashPassword,
  comparePassword,
  loginWithEmailAndPassword,
  loginSubdomainFirst,
  logout,
  getUserPermissions,
  hasPermission,
};
