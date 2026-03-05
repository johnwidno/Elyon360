const db = require('./models');

async function updateRoomSchema() {
    console.log("Starting Room schema update...");
    const queryInterface = db.sequelize.getQueryInterface();

    const columnsToAdd = [
        // 🆔 Identification
        { name: 'code', type: db.Sequelize.STRING, allowNull: true },
        { name: 'floor', type: db.Sequelize.STRING, allowNull: true },
        { name: 'type', type: db.Sequelize.STRING, allowNull: true },

        // 📐 Caractéristiques physiques
        { name: 'layout', type: db.Sequelize.STRING, allowNull: true },
        { name: 'condition', type: db.Sequelize.STRING, defaultValue: 'Bon', allowNull: true },

        // 🏷️ Statut & disponibilité
        { name: 'authorizedUse', type: db.Sequelize.STRING, allowNull: true },
        { name: 'isBookable', type: db.Sequelize.BOOLEAN, defaultValue: true, allowNull: true },
        { name: 'maxBookingDuration', type: db.Sequelize.INTEGER, allowNull: true },
        { name: 'requiresApproval', type: db.Sequelize.BOOLEAN, defaultValue: false, allowNull: true },

        // 📅 Gestion des horaires
        { name: 'recurringSchedule', type: db.Sequelize.JSON, allowNull: true },
        { name: 'defaultAvailability', type: db.Sequelize.JSON, allowNull: true },
        { name: 'bookingRules', type: db.Sequelize.JSON, allowNull: true },

        // 👤 Responsabilités
        { name: 'managerType', type: db.Sequelize.STRING, allowNull: true },
        { name: 'managerContact', type: db.Sequelize.STRING, allowNull: true },

        // 🔧 Sécurité & conditions
        { name: 'pmrAccess', type: db.Sequelize.BOOLEAN, defaultValue: false, allowNull: true },
        { name: 'emergencyExits', type: db.Sequelize.BOOLEAN, defaultValue: false, allowNull: true },
        { name: 'electricalSystem', type: db.Sequelize.BOOLEAN, defaultValue: true, allowNull: true },
        { name: 'specialRules', type: db.Sequelize.TEXT, allowNull: true },

        // 📊 Suivi & maintenance
        { name: 'lastInspection', type: db.Sequelize.DATE, allowNull: true },
        { name: 'nextMaintenance', type: db.Sequelize.DATE, allowNull: true },
        { name: 'maintenanceHistory', type: db.Sequelize.JSON, allowNull: true },
        { name: 'observations', type: db.Sequelize.TEXT, allowNull: true },

        // 📎 Médias & documents
        { name: 'photos', type: db.Sequelize.JSON, allowNull: true },
        { name: 'layoutPlan', type: db.Sequelize.STRING, allowNull: true }
    ];

    for (const col of columnsToAdd) {
        try {
            const attributes = {
                type: col.type,
                allowNull: col.allowNull !== undefined ? col.allowNull : true
            };

            if (col.defaultValue !== undefined) {
                attributes.defaultValue = col.defaultValue;
            }

            await queryInterface.addColumn('rooms', col.name, attributes);
            console.log(`✓ Column '${col.name}' added to 'rooms' table.`);
        } catch (error) {
            if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
                console.log(`⚠ Column '${col.name}' already exists.`);
            } else {
                console.error(`✗ Error adding '${col.name}':`, error.message);
            }
        }
    }

    // Update status ENUM values (from 'active'/'maintenance'/'inactive' to 'Libre'/'Occupée'/'Réservée'/'En maintenance')
    try {
        console.log("\nUpdating 'status' column to new ENUM values...");
        // MySQL ENUM modification requires dropping and recreating the column
        // For safety, we'll use raw query to modify
        await db.sequelize.query(`
            ALTER TABLE rooms 
            MODIFY COLUMN status ENUM('Libre', 'Occupée', 'Réservée', 'En maintenance') 
            DEFAULT 'Libre'
        `);
        console.log("✓ Status column updated with new values.");
    } catch (error) {
        console.error("✗ Error updating status column:", error.message);
    }

    console.log("\n✅ Room schema update complete!");
    process.exit(0);
}

// Run the update
updateRoomSchema().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
