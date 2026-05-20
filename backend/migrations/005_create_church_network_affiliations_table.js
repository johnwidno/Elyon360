'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('church_network_affiliations', {
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
      
      // Status
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'active', 'suspended', 'terminated'),
        defaultValue: 'pending',
        comment: 'pending = church applied, approved = network approved, active = in good standing',
      },
      
      // Affiliation details
      affiliatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When affiliation was approved/activated',
      },
      approvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'Platform admin who approved affiliation',
      },
      
      terminatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When church unaffiliated',
      },
      terminatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'Who terminated the affiliation',
      },
      
      terminationReason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Why affiliation was terminated',
      },
      
      // Notes
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Admin notes about this affiliation',
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
    await queryInterface.addIndex('church_network_affiliations', ['churchId']);
    await queryInterface.addIndex('church_network_affiliations', ['networkId']);
    await queryInterface.addIndex('church_network_affiliations', ['status']);
    // Unique: church can affiliate with network only once (active)
    await queryInterface.addIndex('church_network_affiliations', ['churchId', 'networkId'], {
      unique: true,
      name: 'idx_church_network_unique',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('church_network_affiliations');
  },
};
