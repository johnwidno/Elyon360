const { sequelize } = require('./models');

async function repairDB() {
    console.log('Starting Final DB repair...');
    const queryInterface = sequelize.getQueryInterface();
    const tableNames = await queryInterface.showAllTables();

    // 1. Repair inventory_items
    if (tableNames.includes('inventory_items')) {
        const desc = await queryInterface.describeTable('inventory_items');

        if (!desc.roomId) {
            console.log('Adding roomId to inventory_items...');
            await queryInterface.addColumn('inventory_items', 'roomId', {
                type: require('sequelize').INTEGER,
                allowNull: true,
                references: { model: 'rooms', key: 'id' }
            });
        }
        if (!desc.isShared) {
            console.log('Adding isShared to inventory_items...');
            await queryInterface.addColumn('inventory_items', 'isShared', {
                type: require('sequelize').BOOLEAN,
                defaultValue: false
            });
        }
        if (!desc.quantity_available) {
            console.log('Adding quantity_available to inventory_items...');
            await queryInterface.addColumn('inventory_items', 'quantity_available', {
                type: require('sequelize').INTEGER,
                defaultValue: 0
            });
            await sequelize.query('UPDATE inventory_items SET quantity_available = quantity');
        }
        if (!desc.categoryId) {
            console.log('Adding categoryId to inventory_items...');
            await queryInterface.addColumn('inventory_items', 'categoryId', {
                type: require('sequelize').INTEGER,
                allowNull: true
            });
        }
        if (!desc.managerId) {
            console.log('Adding managerId to inventory_items...');
            await queryInterface.addColumn('inventory_items', 'managerId', {
                type: require('sequelize').INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' }
            });
        }

        console.log('Updating inventory_items status enum...');
        try {
            await sequelize.query("ALTER TABLE inventory_items MODIFY COLUMN status ENUM('bon_etat', 'reparer', 'hors_service', 'perdu') DEFAULT 'bon_etat'");
        } catch (e) { }
    }

    // 2. Repair reservations
    if (tableNames.includes('reservations')) {
        const desc = await queryInterface.describeTable('reservations');
        if (!desc.expectedAttendees) {
            console.log('Adding expectedAttendees to reservations...');
            await queryInterface.addColumn('reservations', 'expectedAttendees', {
                type: require('sequelize').INTEGER,
                allowNull: true
            });
        }
    }

    // 3. Repair events
    if (tableNames.includes('events')) {
        const desc = await queryInterface.describeTable('events');
        if (!desc.roomId) {
            console.log('Adding roomId to events...');
            await queryInterface.addColumn('events', 'roomId', {
                type: require('sequelize').INTEGER,
                allowNull: true,
                references: { model: 'rooms', key: 'id' }
            });
        }
    }

    // 4. Repair sunday_schools
    if (tableNames.includes('sunday_schools')) {
        const desc = await queryInterface.describeTable('sunday_schools');
        if (!desc.roomId) {
            console.log('Adding roomId to sunday_schools...');
            await queryInterface.addColumn('sunday_schools', 'roomId', {
                type: require('sequelize').INTEGER,
                allowNull: true,
                references: { model: 'rooms', key: 'id' }
            });
        }
    }

    console.log('Final DB repair completed.');
    process.exit(0);
}

repairDB().catch(err => {
    console.error('Final Repair failed:', err);
    process.exit(1);
});
