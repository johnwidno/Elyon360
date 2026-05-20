'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      churchId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'churches',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'NULL = Platform role, SPECIFIC = Church-level role',
      },
      networkId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'church_networks',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'NULL = Church/Platform role, SPECIFIC = Network-level role',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Role name: admin, pastor, finance_officer, staff, member, org_admin, etc',
      },
      displayName: {
        type: Sequelize.STRING(150),
        allowNull: false,
        comment: 'User-friendly name for display in UI',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'What this role can do',
      },
      permissionIds: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of permission IDs this role grants',
      },
      domain: {
        type: Sequelize.ENUM('platform', 'network', 'church'),
        allowNull: false,
        comment: 'Permission domain: platform (churchId=NULL, networkId=NULL), network (networkId=SPECIFIC), church (churchId=SPECIFIC)',
      },
      isSystemRole: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'true = Cannot be modified by users, false = Can be customized',
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      
      // Audit trail
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
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
    await queryInterface.addIndex('roles', ['churchId']);
    await queryInterface.addIndex('roles', ['networkId']);
    await queryInterface.addIndex('roles', ['domain']);
    await queryInterface.addIndex('roles', ['name']);
    await queryInterface.addIndex('roles', ['churchId', 'name'], { unique: true, name: 'idx_church_role_name' });
    await queryInterface.addIndex('roles', ['networkId', 'name'], { unique: true, name: 'idx_network_role_name' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('roles');
  },
};
