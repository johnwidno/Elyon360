'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      churchId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'churches',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Church where user has this role (NULL for network/platform roles)',
      },
      networkId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'church_networks',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Network where user has this role (NULL for church/platform roles)',
      },
      
      // Assignment metadata
      assignedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'Who assigned this role',
      },
      
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'true = user has this role, false = role is suspended (soft delete)',
      },
      
      startDate: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this role assignment starts (optional)',
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When this role assignment expires (optional)',
      },
      
      // Audit trail
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
    await queryInterface.addIndex('user_roles', ['userId']);
    await queryInterface.addIndex('user_roles', ['roleId']);
    await queryInterface.addIndex('user_roles', ['churchId']);
    await queryInterface.addIndex('user_roles', ['networkId']);
    await queryInterface.addIndex('user_roles', ['isActive']);
    // Unique constraint: user can only have one role per role per context
    await queryInterface.addIndex('user_roles', ['userId', 'roleId', 'churchId'], {
      unique: true,
      name: 'idx_user_role_church_unique',
      where: { isActive: true },
    });
    await queryInterface.addIndex('user_roles', ['userId', 'roleId', 'networkId'], {
      unique: true,
      name: 'idx_user_role_network_unique',
      where: { isActive: true },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_roles');
  },
};
