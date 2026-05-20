'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('church_data_consent', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      churchId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'churches',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      networkId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'church_networks',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      
      // Data sharing categories (boolean flags)
      shareFinancialData: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Share aggregate financial totals (donations, expenses)',
      },
      shareMembershipData: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Share member count and growth trends',
      },
      shareEventData: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Share event data and attendance trends',
      },
      shareActivityData: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Share activity/group engagement data',
      },
      shareAttendanceData: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Share service attendance patterns',
      },
      shareDetailedFinances: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Share line-by-line ledger entries (sensitive)',
      },
      shareMemberNames: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Share individual member names (PII sensitive)',
      },
      
      // Custom categories (JSON for extensibility)
      customSharedCategories: {
        type: Sequelize.JSON,
        defaultValue: {},
        comment: 'Custom data sharing categories as JSON object',
      },
      
      // Audit trail
      lastModifiedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      lastModifiedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Indexes
    await queryInterface.addIndex('church_data_consent', ['churchId']);
    await queryInterface.addIndex('church_data_consent', ['networkId']);
    // Unique: one consent record per church-network pair
    await queryInterface.addIndex('church_data_consent', ['churchId', 'networkId'], {
      unique: true,
      name: 'idx_church_network_consent_unique',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('church_data_consent');
  },
};
