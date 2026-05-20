'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('church_networks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Diocese, District, Network, Mission, or Institution name',
      },
      type: {
        type: Sequelize.ENUM('diocese', 'district', 'network', 'mission', 'institution', 'other'),
        allowNull: false,
        defaultValue: 'diocese',
        comment: 'Type of organization grouping',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      leaderEmail: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Primary contact email for network leader',
      },
      leaderName: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Name of network leader (bishop, district overseer, etc)',
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Country where network operates',
      },
      region: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Region/state where network operates',
      },
      
      // Platform relationship
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'Platform admin who created this network',
      },
      
      // Status
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'archived'),
        allowNull: false,
        defaultValue: 'active',
      },
      
      // Timestamps
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
    await queryInterface.addIndex('church_networks', ['name']);
    await queryInterface.addIndex('church_networks', ['status']);
    await queryInterface.addIndex('church_networks', ['type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('church_networks');
  },
};
