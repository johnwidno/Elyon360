const db = require('./models');

async function cleanup() {
    try {
        console.log("Starting index cleanup...");
        const [results] = await db.sequelize.query("SHOW INDEX FROM churches");

        for (const row of results) {
            const indexName = row.Key_name;
            // Drop indexes that end with _X (e.g., subdomain_2, customDomain_31)
            if (indexName.includes('_') && !indexName.startsWith('fk_')) {
                const parts = indexName.split('_');
                const lastPart = parts[parts.length - 1];
                if (!isNaN(parseInt(lastPart))) {
                    console.log(`Dropping index: ${indexName}`);
                    await db.sequelize.query(`ALTER TABLE churches DROP INDEX ${indexName}`);
                }
            }
        }
        console.log("Cleanup completed successfully.");
    } catch (error) {
        console.error("Cleanup failed:", error);
    } finally {
        await db.sequelize.close();
    }
}

cleanup();
