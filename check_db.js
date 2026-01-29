const db = require('./backend/models');

async function check() {
    try {
        const [results] = await db.sequelize.query("DESCRIBE churches");
        console.log("CHURCHES TABLE COLUMNS:");
        results.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });
    } catch (err) {
        console.error("CHECK ERROR:", err);
    } finally {
        await db.sequelize.close();
        process.exit(0);
    }
}

check();
