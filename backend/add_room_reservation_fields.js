const db = require('./models');

async function addRoomReservationFields() {
    console.log("Adding room reservation fields to groups and sunday_schools tables...");
    const queryInterface = db.sequelize.getQueryInterface();

    const fieldsToAdd = [
        {
            table: 'groups',
            fields: [
                {
                    name: 'roomId',
                    type: db.Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'rooms', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                },
                {
                    name: 'recurringSchedule',
                    type: db.Sequelize.JSON,
                    allowNull: true
                }
            ]
        },
        {
            table: 'sunday_schools',
            fields: [
                {
                    name: 'roomId',
                    type: db.Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'rooms', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                },
                {
                    name: 'recurringSchedule',
                    type: db.Sequelize.JSON,
                    allowNull: true
                }
            ]
        }
    ];

    for (const tableConfig of fieldsToAdd) {
        console.log(`\nProcessing table: ${tableConfig.table}`);

        for (const field of tableConfig.fields) {
            try {
                const attributes = {
                    type: field.type,
                    allowNull: field.allowNull !== undefined ? field.allowNull : true
                };

                if (field.references) {
                    attributes.references = field.references;
                    attributes.onUpdate = field.onUpdate || 'CASCADE';
                    attributes.onDelete = field.onDelete || 'SET NULL';
                }

                await queryInterface.addColumn(tableConfig.table, field.name, attributes);
                console.log(`  ✓ Column '${field.name}' added to '${tableConfig.table}' table.`);
            } catch (error) {
                if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
                    console.log(`  ⚠ Column '${field.name}' already exists in '${tableConfig.table}'.`);
                } else {
                    console.error(`  ✗ Error adding '${field.name}' to '${tableConfig.table}':`, error.message);
                }
            }
        }
    }

    console.log("\n✅ Room reservation fields migration complete!");
    process.exit(0);
}

// Run the migration
addRoomReservationFields().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
