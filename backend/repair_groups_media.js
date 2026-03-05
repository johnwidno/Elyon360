const { sequelize } = require('./models');
const { DataTypes } = require('sequelize');

async function repairGroups() {
    console.log('Starting Groups DB repair...');
    const queryInterface = sequelize.getQueryInterface();
    const desc = await queryInterface.describeTable('groups');

    if (!desc.logo) {
        console.log('Adding logo to groups...');
        await queryInterface.addColumn('groups', 'logo', {
            type: DataTypes.STRING,
            allowNull: true
        });
    }

    if (!desc.charter) {
        console.log('Adding charter to groups...');
        await queryInterface.addColumn('groups', 'charter', {
            type: DataTypes.STRING,
            allowNull: true
        });
    }

    console.log('Groups DB repair completed.');
    process.exit(0);
}

repairGroups().catch(err => {
    console.error('Groups Repair failed:', err);
    process.exit(1);
});
