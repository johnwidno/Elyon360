const { Sequelize } = require('sequelize');

module.exports = {
    up: async (queryInterface) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.addColumn('visitors', 'notes', {
                type: Sequelize.TEXT,
                allowNull: true
            }, { transaction });

            await transaction.commit();
            console.log('✅ Added notes column to visitors table');
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Failed to add notes column:', error);
            throw error;
        }
    },

    down: async (queryInterface) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.removeColumn('visitors', 'notes', { transaction });
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};
