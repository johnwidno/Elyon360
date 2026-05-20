/**
 * Phase 2: Security Layer Testing
 * 
 * Tests for:
 * - Audit logging functionality
 * - JWT validation middleware
 * - Rate limiting
 * - Subdomain extraction
 * - Email enumeration prevention
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Sequelize } = require('sequelize');

describe('Phase 2: Security Layer - Basic Schema Validation', () => {
  let sequelize;

  beforeAll(async () => {
    sequelize = new Sequelize(
      process.env.DB_NAME || 'elyon360',
      process.env.DB_USER || 'elyon_user',
      process.env.DB_PASSWORD || 'elyon_pass',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
      }
    );

    try {
      await sequelize.authenticate();
    } catch (error) {
      console.error('Database connection failed:', error.message);
      throw error;
    }
  });

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });

  describe('Audit Logs Table', () => {
    test('audit_logs table should exist', async () => {
      const tables = await sequelize.queryInterface.showAllTables();
      expect(tables).toContain('audit_logs');
    });

    test('audit_logs should have required columns', async () => {
      const columns = await sequelize.queryInterface.describeTable('audit_logs');

      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('eventType');
      expect(columns).toHaveProperty('severity');
      expect(columns).toHaveProperty('status');
      expect(columns).toHaveProperty('userId');
      expect(columns).toHaveProperty('churchId');
      expect(columns).toHaveProperty('networkId');
      expect(columns).toHaveProperty('ipAddress');
      expect(columns).toHaveProperty('userAgent');
      expect(columns).toHaveProperty('requestMethod');
      expect(columns).toHaveProperty('requestPath');
      expect(columns).toHaveProperty('resourceType');
      expect(columns).toHaveProperty('resourceId');
      expect(columns).toHaveProperty('action');
      expect(columns).toHaveProperty('errorMessage');
      expect(columns).toHaveProperty('errorCode');
      expect(columns).toHaveProperty('description');
      expect(columns).toHaveProperty('metadata');
      expect(columns).toHaveProperty('createdAt');
    });

    test('audit_logs should have proper column types', async () => {
      const columns = await sequelize.queryInterface.describeTable('audit_logs');

      // UUID primary key
      expect(columns.id.type).toMatch(/uuid/i);

      // ENUM columns
      expect(columns.eventType.type.toUpperCase()).toMatch(/ENUM|USER-DEFINED/);
      expect(columns.severity.type.toUpperCase()).toMatch(/ENUM|USER-DEFINED/);
      expect(columns.status.type.toUpperCase()).toMatch(/ENUM|USER-DEFINED/);

      // JSON metadata
      expect(columns.metadata.type).toMatch(/json/i);

      // Foreign keys
      expect(columns.userId.type).toMatch(/int/i);
      expect(columns.churchId.type).toMatch(/int/i);
      expect(columns.networkId.type).toMatch(/int/i);
    });

    test('audit_logs should have indexes for efficient querying', async () => {
      const indexes = await sequelize.queryInterface.showIndex('audit_logs');
      expect(indexes.length).toBeGreaterThan(0);

      const indexNames = indexes.map((idx) => idx.name);
      expect(indexNames.some((name) => name && name.includes('userId'))).toBe(true);
      expect(indexNames.some((name) => name && name.includes('eventType'))).toBe(true);
      expect(indexNames.some((name) => name && name.includes('createdAt'))).toBe(true);
    });

    test('audit_logs should NOT have updatedAt (immutable)', async () => {
      const columns = await sequelize.queryInterface.describeTable('audit_logs');
      expect(columns).not.toHaveProperty('updatedAt');
    });
  });

  describe('Authentication Configuration', () => {
    test('JWT_SECRET should be configured', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET).toBeTruthy();
    });

    test('JWT_EXPIRY should be configured', () => {
      expect(process.env.JWT_EXPIRY).toBeDefined();
      expect(process.env.JWT_EXPIRY).toBeTruthy();
    });

    test('Rate limiting should be configured', () => {
      expect(process.env.RATE_LIMIT_WINDOW).toBeDefined();
      expect(process.env.RATE_LIMIT_MAX_REQUESTS).toBeDefined();
      expect(process.env.LOGIN_RATE_LIMIT_WINDOW).toBeDefined();
      expect(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS).toBeDefined();
    });
  });

  describe('Security Files Created', () => {
    test('verifyJWT middleware should exist', () => {
      const verifyJWT = require('../middleware/verifyJWT');
      expect(verifyJWT.verifyJWT).toBeDefined();
      expect(verifyJWT.validateTokenDomain).toBeDefined();
      expect(verifyJWT.requirePermission).toBeDefined();
    });

    test('rateLimiter middleware should exist', () => {
      const rateLimiter = require('../middleware/rateLimiter');
      expect(rateLimiter.createRateLimiter).toBeDefined();
      expect(rateLimiter.loginRateLimiter).toBeDefined();
      expect(rateLimiter.apiRateLimiter).toBeDefined();
    });

    test('subdomain middleware should exist', () => {
      const subdomain = require('../middleware/subdomain');
      expect(subdomain.extractSubdomain).toBeDefined();
      expect(subdomain.resolveSubdomainToChurch).toBeDefined();
      expect(subdomain.extractSubdomainMiddleware).toBeDefined();
    });

    test('authService should exist', () => {
      const authService = require('../services/authService');
      expect(authService.generateToken).toBeDefined();
      expect(authService.loginWithEmailAndPassword).toBeDefined();
      expect(authService.loginSubdomainFirst).toBeDefined();
    });

    test('Phase 2 authController should exist', () => {
      const authController = require('../controllers/authController');
      expect(authController.loginSubdomain).toBeDefined();
      expect(authController.loginChurch).toBeDefined();
      expect(authController.logout).toBeDefined();
      expect(authController.getCurrentUser).toBeDefined();
    });
  });

  describe('Security Features Enabled', () => {
    test('Email enumeration prevention implemented', () => {
      // Check that loginWithEmailAndPassword requires churchId
      const authService = require('../services/authService');
      expect(authService.loginWithEmailAndPassword.length).toBeGreaterThanOrEqual(3);
    });

    test('Subdomain extraction implemented', () => {
      const { extractSubdomain } = require('../middleware/subdomain');

      // Test cases
      expect(extractSubdomain('mychurch.elyon360.app')).toBe('mychurch');
      expect(extractSubdomain('grace-church.elyon360.app')).toBe('grace-church');
      expect(extractSubdomain('localhost')).toBeNull();
      expect(extractSubdomain('localhost:5000')).toBeNull();
      expect(extractSubdomain('www.elyon360.app')).toBeNull(); // reserved
      expect(extractSubdomain('api.elyon360.app')).toBeNull(); // reserved
    });

    test('Rate limiting should support strict login limits', () => {
      const { loginRateLimiter } = require('../middleware/rateLimiter');
      expect(loginRateLimiter).toBeDefined();
    });

    test('Audit logging should track all auth events', async () => {
      const db = require('../models');
      const tableNames = await sequelize.queryInterface.showAllTables();
      expect(tableNames).toContain('audit_logs');

      // Check that AuditLog model is registered
      expect(db.AuditLog).toBeDefined();
    });
  });

  describe('Database Integrity', () => {
    test('Foreign keys should be properly configured for audit_logs', async () => {
      // Query information_schema for foreign key constraints
      const [fkConstraints] = await sequelize.query(
        `SELECT constraint_name, column_name
         FROM information_schema.key_column_usage 
         WHERE table_name = 'audit_logs' 
         AND constraint_name LIKE '%fkey%'`
      );

      const fkMap = {};
      fkConstraints.forEach((row) => {
        fkMap[row.column_name] = row.constraint_name;
      });

      // Verify all expected foreign keys exist
      expect(fkMap.userId).toBe('audit_logs_userId_fkey');
      expect(fkMap.churchId).toBe('audit_logs_churchId_fkey');
      expect(fkMap.networkId).toBe('audit_logs_networkId_fkey');
    });
  });
});
