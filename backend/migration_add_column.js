const db = require('./models');

async function migrate() {
    try {
        console.log("Starting migration: Adding moncashTransactionId to churches table...");
        const queryInterface = db.sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('churches');

        if (!tableInfo.moncashTransactionId) {
            await queryInterface.addColumn('churches', 'moncashTransactionId', {
                type: db.Sequelize.STRING,
                allowNull: true
            });
            console.log("SUCCESS: Column moncashTransactionId added.");
        } else {
            console.log("INFO: Column moncashTransactionId already exists.");
        }

        process.exit(0);
    } catch (error) {
        console.error("MIGRATION FAILED:", error);
        process.exit(1);
    }
}

migrate();
