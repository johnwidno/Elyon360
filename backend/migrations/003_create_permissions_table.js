'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('permissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Permission identifier: churches:read, members:write, roles:create, etc',
      },
      displayName: {
        type: Sequelize.STRING(150),
        allowNull: false,
        comment: 'User-friendly name',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'What this permission allows',
      },
      domain: {
        type: Sequelize.ENUM('platform', 'network', 'church'),
        allowNull: false,
        comment: 'Which permission domain this applies to',
      },
      category: {
        type: Sequelize.ENUM(
          'roles',
          'members',
          'finances',
          'events',
          'content',
          'settings',
          'reports',
          'groups',
          'notifications',
          'admin',
          'other'
        ),
        allowNull: false,
        defaultValue: 'other',
        comment: 'Functional category for grouping',
      },
      resource: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'What resource this controls: churches, members, finances, etc',
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Action allowed: read, write, create, delete, approve, etc',
      },
      
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.addIndex('permissions', ['domain']);
    await queryInterface.addIndex('permissions', ['category']);
    await queryInterface.addIndex('permissions', ['resource']);
    await queryInterface.addIndex('permissions', ['name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('permissions');
  },
};
