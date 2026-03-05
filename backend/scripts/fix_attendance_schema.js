const db = require("../models");

async function fixSchema() {
    try {
        console.log("Checking for 'reportId' column in sunday_school_attendances...");
        const queryInterface = db.sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('sunday_school_attendances');

        if (!tableInfo.reportId) {
            console.log("Adding 'reportId' column...");
            await queryInterface.addColumn('sunday_school_attendances', 'reportId', {
                type: db.Sequelize.INTEGER,
                allowNull: true
            });
            console.log("Column 'reportId' added successfully.");
        } else {
            console.log("Column 'reportId' already exists.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error fixing schema:", error);
        process.exit(1);
    }
}

fixSchema();
