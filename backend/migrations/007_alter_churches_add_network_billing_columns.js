'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add columns to churches table to support new architecture
    // Note: Most of these columns likely already exist from earlier phases
    
    const columnExists = async (tableName, columnName) => {
      const result = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name='${tableName}' AND column_name='${columnName}'`
      );
      return result[0].length > 0;
    };

    // Check and add networkId if needed
    if (!(await columnExists('churches', 'networkId'))) {
      await queryInterface.addColumn('churches', 'networkId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'church_networks',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'Network this church belongs to (optional)',
      });
    }

    // Check and add planId if needed
    if (!(await columnExists('churches', 'planId'))) {
      await queryInterface.addColumn('churches', 'planId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Current subscription plan (0 = trial)',
      });
    }

    // Check and add subscriptionStatus if needed
    if (!(await columnExists('churches', 'subscriptionStatus'))) {
      await queryInterface.addColumn('churches', 'subscriptionStatus', {
        type: Sequelize.ENUM('trial', 'trial_expired', 'active', 'suspended', 'cancelled'),
        allowNull: true,
        defaultValue: 'trial',
        comment: 'Current subscription state',
      });
    }

    // Check and add trialStartedAt if needed
    if (!(await columnExists('churches', 'trialStartedAt'))) {
      await queryInterface.addColumn('churches', 'trialStartedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When 30-day trial started',
      });
    }

    // Check and add nextBillingDate if needed
    if (!(await columnExists('churches', 'nextBillingDate'))) {
      await queryInterface.addColumn('churches', 'nextBillingDate', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Next payment date (Stripe)',
      });
    }

    // Add index on networkId if it doesn't exist
    const indexes = await queryInterface.sequelize.query(
      `SELECT indexname FROM pg_indexes WHERE tablename='churches' AND indexname LIKE '%networkId%'`
    );
    
    if (indexes[0].length === 0) {
      await queryInterface.addIndex('churches', ['networkId']);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Carefully remove only the columns we added
    const columnExists = async (tableName, columnName) => {
      const result = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name='${tableName}' AND column_name='${columnName}'`
      );
      return result[0].length > 0;
    };

    if (await columnExists('churches', 'networkId')) {
      await queryInterface.removeColumn('churches', 'networkId');
    }
    if (await columnExists('churches', 'planId')) {
      await queryInterface.removeColumn('churches', 'planId');
    }
    if (await columnExists('churches', 'subscriptionStatus')) {
      await queryInterface.removeColumn('churches', 'subscriptionStatus');
    }
    if (await columnExists('churches', 'trialStartedAt')) {
      await queryInterface.removeColumn('churches', 'trialStartedAt');
    }
    if (await columnExists('churches', 'nextBillingDate')) {
      await queryInterface.removeColumn('churches', 'nextBillingDate');
    }
  },
};
