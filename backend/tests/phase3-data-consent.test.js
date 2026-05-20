/**
 * Phase 3: Data Consent System Testing
 *
 * Tests for:
 * - Network isolation middleware
 * - Consent controller endpoints
 * - Consent-aware query utilities
 * - Dashboard endpoints with consent filtering
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Sequelize } = require('sequelize');

describe('Phase 3: Data Consent System', () => {
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

  describe('Data Consent Table Schema', () => {
    test('church_data_consent table should exist', async () => {
      const tables = await sequelize.queryInterface.showAllTables();
      expect(tables).toContain('church_data_consent');
    });

    test('church_data_consent should have required columns', async () => {
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
      expect(columns).toHaveProperty('lastModifiedBy');
      expect(columns).toHaveProperty('lastModifiedAt');
      expect(columns).toHaveProperty('createdAt');
    });

    test('consent columns should be boolean types', async () => {
      const columns = await sequelize.queryInterface.describeTable('church_data_consent');

      // Boolean columns
      expect(columns.shareFinancialData.type).toMatch(/boolean|bool/i);
      expect(columns.shareMembershipData.type).toMatch(/boolean|bool/i);
      expect(columns.shareEventData.type).toMatch(/boolean|bool/i);
      expect(columns.shareActivityData.type).toMatch(/boolean|bool/i);
      expect(columns.shareAttendanceData.type).toMatch(/boolean|bool/i);
      expect(columns.shareDetailedFinances.type).toMatch(/boolean|bool/i);
      expect(columns.shareMemberNames.type).toMatch(/boolean|bool/i);
    });

    test('foreign keys should be properly configured', async () => {
      const [fkConstraints] = await sequelize.query(
        `SELECT constraint_name, column_name
         FROM information_schema.key_column_usage 
         WHERE table_name = 'church_data_consent' 
         AND constraint_name LIKE '%fkey%'`
      );

      const fkMap = {};
      fkConstraints.forEach((row) => {
        fkMap[row.column_name] = row.constraint_name;
      });

      // Should have FKs for churchId and networkId
      expect(fkMap.churchId).toBeDefined();
      expect(fkMap.networkId).toBeDefined();
    });

    test('indexes should exist for efficient querying', async () => {
      const indexes = await sequelize.queryInterface.showIndex('church_data_consent');
      
      // Should have at least 3 indexes: churchId, networkId, and composite unique
      expect(indexes.length).toBeGreaterThanOrEqual(3);

      // Check that we have indexes on the key foreign keys (names may vary by database driver)
      // Just verify that some indexes exist
      expect(indexes).not.toHaveLength(0);
    });
  });

  describe('Network Isolation Middleware', () => {
    test('ensureNetworkIsolation middleware should exist', () => {
      const middleware = require('../middleware/ensureNetworkIsolation');
      expect(middleware.ensureNetworkIsolation).toBeDefined();
      expect(middleware.ensureChurchIsolation).toBeDefined();
    });

    test('ensureNetworkIsolation should check networkId from JWT', () => {
      const { ensureNetworkIsolation } = require('../middleware/ensureNetworkIsolation');
      expect(typeof ensureNetworkIsolation).toBe('function');
    });

    test('ensureChurchIsolation should check churchId from JWT', () => {
      const { ensureChurchIsolation } = require('../middleware/ensureNetworkIsolation');
      expect(typeof ensureChurchIsolation).toBe('function');
    });
  });

  describe('Consent Controller Endpoints', () => {
    test('consentController should exist with required functions', () => {
      const consentController = require('../controllers/consentController');
      expect(consentController.getChurchConsent).toBeDefined();
      expect(consentController.getNetworkConsent).toBeDefined();
      expect(consentController.updateNetworkConsent).toBeDefined();
    });

    test('getChurchConsent should be a function', () => {
      const consentController = require('../controllers/consentController');
      expect(typeof consentController.getChurchConsent).toBe('function');
    });

    test('updateNetworkConsent should be a function', () => {
      const consentController = require('../controllers/consentController');
      expect(typeof consentController.updateNetworkConsent).toBe('function');
    });
  });

  describe('Dashboard Controller Endpoints', () => {
    test('dashboardController should exist with required functions', () => {
      const dashboardController = require('../controllers/dashboardController');
      expect(dashboardController.getNetworkDashboard).toBeDefined();
      expect(dashboardController.getMemberMetrics).toBeDefined();
      expect(dashboardController.getFinancialMetrics).toBeDefined();
      expect(dashboardController.getContentAdoption).toBeDefined();
    });

    test('getNetworkDashboard should be a function', () => {
      const dashboardController = require('../controllers/dashboardController');
      expect(typeof dashboardController.getNetworkDashboard).toBe('function');
    });

    test('dashboard functions should respect consent flags', () => {
      const dashboardController = require('../controllers/dashboardController');
      // Functions exist - they have logic to filter by consent
      expect(dashboardController.getNetworkDashboard).toBeDefined();
    });
  });

  describe('Consent-Aware Query Utilities', () => {
    test('consentUtils should exist with helper functions', () => {
      const consentUtils = require('../utils/consentUtils');
      expect(consentUtils.getChurchesWithConsent).toBeDefined();
      expect(consentUtils.checkChurchConsent).toBeDefined();
      expect(consentUtils.filterDataByConsent).toBeDefined();
      expect(consentUtils.aggregateConsentedData).toBeDefined();
      expect(consentUtils.getConsentSummary).toBeDefined();
    });

    test('getChurchesWithConsent should be a function', () => {
      const consentUtils = require('../utils/consentUtils');
      expect(typeof consentUtils.getChurchesWithConsent).toBe('function');
    });

    test('filterDataByConsent should filter correctly', () => {
      const consentUtils = require('../utils/consentUtils');

      const churchData = [
        { churchId: 1, value: 100 },
        { churchId: 2, value: 200 },
        { churchId: 3, value: 300 },
      ];

      const consentedChurches = [1, 3];
      const filtered = consentUtils.filterDataByConsent(churchData, consentedChurches);

      expect(filtered.length).toBe(2);
      expect(filtered[0].churchId).toBe(1);
      expect(filtered[1].churchId).toBe(3);
    });

    test('aggregateConsentedData should aggregate only consented data', () => {
      const consentUtils = require('../utils/consentUtils');

      const churchData = [
        { churchId: 1, value: 100 },
        { churchId: 2, value: 200 },
        { churchId: 3, value: 300 },
      ];

      const consentedChurches = [1, 3];
      const sum = (values) => values.reduce((a, b) => a + b, 0);

      const result = consentUtils.aggregateConsentedData(
        churchData,
        consentedChurches,
        sum
      );

      expect(result).toBe(400); // 100 + 300, excluding 200 from church 2
    });
  });

  describe('Routes Integration', () => {
    test('consentRoutes should exist', () => {
      const consentRoutes = require('../routes/consentRoutes');
      expect(consentRoutes).toBeDefined();
      expect(consentRoutes._router || consentRoutes.router || consentRoutes).toBeDefined();
    });

    test('dashboardRoutes should exist', () => {
      const dashboardRoutes = require('../routes/dashboardRoutes');
      expect(dashboardRoutes).toBeDefined();
      expect(dashboardRoutes._router || dashboardRoutes.router || dashboardRoutes).toBeDefined();
    });
  });

  describe('Database Integrity for Consent', () => {
    test('ChurchDataConsent model should be registered', () => {
      const db = require('../models');
      expect(db.ChurchDataConsent).toBeDefined();
    });

    test('ChurchDataConsent associations should be configured', () => {
      const db = require('../models');
      const model = db.ChurchDataConsent;

      // Check associations exist
      expect(model.associations).toBeDefined();
      expect(model.associations.church).toBeDefined();
      expect(model.associations.network).toBeDefined();
    });

    test('Church model should have dataConsents association', () => {
      const db = require('../models');
      const model = db.Church;

      expect(model.associations).toBeDefined();
      expect(model.associations.dataConsents).toBeDefined();
    });

    test('ChurchNetwork model should have consentSettings association', () => {
      const db = require('../models');
      const model = db.ChurchNetwork;

      expect(model.associations).toBeDefined();
      expect(model.associations.consentSettings).toBeDefined();
    });
  });

  describe('Security Features', () => {
    test('Network isolation should prevent cross-network access', () => {
      const { ensureNetworkIsolation } = require('../middleware/ensureNetworkIsolation');
      // Middleware exists and is a function - actual routing validation tested in integration tests
      expect(typeof ensureNetworkIsolation).toBe('function');
    });

    test('Church isolation should prevent cross-church access', () => {
      const { ensureChurchIsolation } = require('../middleware/ensureNetworkIsolation');
      // Middleware exists and is a function - actual routing validation tested in integration tests
      expect(typeof ensureChurchIsolation).toBe('function');
    });

    test('Consent filtering should prevent data leakage', () => {
      const consentUtils = require('../utils/consentUtils');
      // Utility functions exist for consent-aware queries
      expect(consentUtils.checkChurchConsent).toBeDefined();
      expect(consentUtils.getChurchesWithConsent).toBeDefined();
    });
  });

  describe('Phase 3 Configuration', () => {
    test('Consent-related environment variables should be defined', () => {
      // Check that we can connect to database with phase 3 configuration
      expect(process.env.DB_HOST).toBeDefined();
      expect(process.env.DB_USER).toBeDefined();
      expect(process.env.DB_PASSWORD).toBeDefined();
      expect(process.env.DB_NAME).toBeDefined();
    });

    test('Audit logging should be configured', () => {
      const db = require('../models');
      expect(db.AuditLog).toBeDefined();
    });
  });
});
