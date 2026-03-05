const db = require('./models');

async function checkSchema() {
    try {
        const queryInterface = db.sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('churches');
        console.log("Table 'churches' structure:");
        console.log(JSON.stringify(tableInfo, null, 2));
    } catch (error) {
        console.error("Error checking schema:", error);
    } finally {
        await db.sequelize.close();
    }
}

checkSchema();
