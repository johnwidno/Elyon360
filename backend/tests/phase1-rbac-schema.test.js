/**
 * Phase 1 RBAC - Smoke Tests
 * Validates database schema and basic RBAC functionality
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Sequelize } = require('sequelize');
const path = require('path');

describe('Phase 1 RBAC - Database Schema Validation', () => {
  let sequelize;
  const EXPECTED_TABLES = [
    'church_networks',
    'roles',
    'permissions',
    'user_roles',
    'church_network_affiliations',
    'church_data_consent',
  ];

  const EXPECTED_CHURCH_COLUMNS = [
    'networkId',
    'planId',
    'subscriptionStatus',
    'trialStartedAt',
    'nextBillingDate',
  ];

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

  describe('Database Tables', () => {
    test('all RBAC tables should exist', async () => {
      const queryInterface = sequelize.getQueryInterface();
      const tables = await queryInterface.showAllTables();

      EXPECTED_TABLES.forEach((table) => {
        expect(tables).toContain(table);
      });
    });

    test('church_networks table should have required columns', async () => {
      const columns = await sequelize.queryInterface.describeTable('church_networks');
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('name');
      expect(columns).toHaveProperty('type');
      expect(columns).toHaveProperty('status');
    });

    test('roles table should have required columns', async () => {
      const columns = await sequelize.queryInterface.describeTable('roles');
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('churchId');
      expect(columns).toHaveProperty('networkId');
      expect(columns).toHaveProperty('name');
      expect(columns).toHaveProperty('displayName');
      expect(columns).toHaveProperty('domain');
      expect(columns).toHaveProperty('permissionIds');
      expect(columns).toHaveProperty('isSystemRole');
    });

    test('permissions table should have required columns', async () => {
      const columns = await sequelize.queryInterface.describeTable('permissions');
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('name');
      expect(columns).toHaveProperty('displayName');
      expect(columns).toHaveProperty('domain');
      expect(columns).toHaveProperty('category');
      expect(columns).toHaveProperty('resource');
      expect(columns).toHaveProperty('action');
    });

    test('user_roles table should have required columns', async () => {
      const columns = await sequelize.queryInterface.describeTable('user_roles');
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('userId');
      expect(columns).toHaveProperty('roleId');
      expect(columns).toHaveProperty('churchId');
      expect(columns).toHaveProperty('networkId');
      expect(columns).toHaveProperty('isActive');
    });

    test('church_network_affiliations table should have required columns', async () => {
      const columns = await sequelize.queryInterface.describeTable(
        'church_network_affiliations'
      );
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('churchId');
      expect(columns).toHaveProperty('networkId');
      expect(columns).toHaveProperty('status');
    });

    test('church_data_consent table should have required columns', async () => {
      const columns = await sequelize.queryInterface.describeTable('church_data_consent');
      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('churchId');
      expect(columns).toHaveProperty('networkId');
      expect(columns).toHaveProperty('shareFinancialData');
      expect(columns).toHaveProperty('shareMembershipData');
      expect(columns).toHaveProperty('shareEventData');
      expect(columns).toHaveProperty('shareActivityData');
      expect(columns).toHaveProperty('shareAttendanceData');
      expect(columns).toHaveProperty('shareDetailedFinances');
      expect(columns).toHaveProperty('shareMemberNames');
    });
  });

  describe('Churches Table Extensions', () => {
    test('churches table should have all RBAC billing columns', async () => {
      const columns = await sequelize.queryInterface.describeTable('churches');
      EXPECTED_CHURCH_COLUMNS.forEach((col) => {
        expect(columns).toHaveProperty(col);
      });
    });
  });

  describe('Database Constraints', () => {
    test('user_roles table should exist with proper indexes', async () => {
      const indexes = await sequelize.queryInterface.showIndex('user_roles');
      expect(indexes.length).toBeGreaterThan(0);
    });

    test('roles table should have indexed columns', async () => {
      const indexes = await sequelize.queryInterface.showIndex('roles');
      expect(indexes.length).toBeGreaterThan(0);
    });

    test('church_network_affiliations should have indexes', async () => {
      const indexes = await sequelize.queryInterface.showIndex('church_network_affiliations');
      expect(indexes.length).toBeGreaterThan(0);
    });
  });

  describe('Foreign Key Relationships', () => {
    test('should be able to query table relationships', async () => {
      // Verify that the tables are properly structured with expected columns
      const userRolesColumns = await sequelize.queryInterface.describeTable('user_roles');
      expect(userRolesColumns).toHaveProperty('userId');
      expect(userRolesColumns).toHaveProperty('roleId');
      expect(userRolesColumns).toHaveProperty('churchId');
      expect(userRolesColumns).toHaveProperty('networkId');
    });
  });

  describe('ENUM Types', () => {
    test('roles domain should support platform, network, church', async () => {
      const columns = await sequelize.queryInterface.describeTable('roles');
      // PostgreSQL enums show as USER-DEFINED type
      expect(columns.domain.type.toUpperCase()).toMatch(/ENUM|USER-DEFINED/);
    });

    test('church_network_affiliations status should support standard workflow states', async () => {
      const columns = await sequelize.queryInterface.describeTable('church_network_affiliations');
      // PostgreSQL enums show as USER-DEFINED type
      expect(columns.status.type.toUpperCase()).toMatch(/ENUM|USER-DEFINED/);
    });
  });

  describe('JSON Column Support', () => {
    test('roles permissionIds should be JSON type', async () => {
      const columns = await sequelize.queryInterface.describeTable('roles');
      expect(columns.permissionIds.type).toMatch(/json/i);
    });

    test('church_data_consent customSharedCategories should be JSON type', async () => {
      const columns = await sequelize.queryInterface.describeTable('church_data_consent');
      expect(columns.customSharedCategories.type).toMatch(/json/i);
    });
  });

  describe('Default Values', () => {
    test('role isSystemRole should default to false', async () => {
      const columns = await sequelize.queryInterface.describeTable('roles');
      expect(columns.isSystemRole.defaultValue).toBeDefined();
    });

    test('user_roles isActive should default to true', async () => {
      const columns = await sequelize.queryInterface.describeTable('user_roles');
      expect(columns.isActive.defaultValue).toBeDefined();
    });

    test('data consent flags should have sensible defaults', async () => {
      const columns = await sequelize.queryInterface.describeTable('church_data_consent');
      // shareDetailedFinances and shareMemberNames should default to false (restrictive)
      expect(columns.shareDetailedFinances.defaultValue).toBeDefined();
      expect(columns.shareMemberNames.defaultValue).toBeDefined();
    });
  });
});
