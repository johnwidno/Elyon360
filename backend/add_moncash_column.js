const { Sequelize } = require('sequelize');
const config = require('./models/index.js'); // Assuming this exports the DB config or initialized sequelize
const db = require('./models');

async function migrate() {
    try {
        const queryInterface = db.sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('churches');

        if (!tableInfo.moncashOrderId) {
            console.log("Adding moncashOrderId column to churches table...");
            await queryInterface.addColumn('churches', 'moncashOrderId', {
                type: Sequelize.STRING,
                allowNull: true
            });
            console.log("Column moncashOrderId added successfully.");
        } else {
            console.log("Column moncashOrderId already exists.");
        }

        // Also ensure status default is inactive
        console.log("Ensuring status column default is 'inactive'...");
        await db.sequelize.query("ALTER TABLE churches ALTER COLUMN status SET DEFAULT 'inactive';").catch(e => {
            // MySQL syntax might be different
            return db.sequelize.query("ALTER TABLE churches MODIFY COLUMN status ENUM('active', 'inactive') DEFAULT 'inactive';");
        });
        console.log("Status default updated.");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await db.sequelize.close();
    }
}

migrate();
