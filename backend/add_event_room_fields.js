const db = require('./models');

async function migrate() {
    try {
        console.log("Adding room reservation fields to Events table...");

        const queryInterface = db.sequelize.getQueryInterface();

        // Add roomId column
        await queryInterface.addColumn('events', 'roomId', {
            type: db.Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'rooms',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
        console.log("- Added roomId column");

        // Add recurringSchedule column
        await queryInterface.addColumn('events', 'recurringSchedule', {
            type: db.Sequelize.JSON,
            allowNull: true
        });
        console.log("- Added recurringSchedule column");

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit();
    }
}

migrate();
