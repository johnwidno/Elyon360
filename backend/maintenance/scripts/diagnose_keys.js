const db = require('./models');

async function diagnose() {
    try {
        console.log("--- Diagnosing churches table indexes ---");
        const [results] = await db.sequelize.query("SHOW INDEX FROM churches");
        console.log(`Found ${results.length} indexes.`);

        const indexNames = results.map(r => r.Key_name);
        const uniqueIndexes = [...new Set(indexNames)];
        console.log("Unique index names:", uniqueIndexes);

        if (results.length > 50) {
            console.log("CRITICAL: Table has too many indexes. This is likely caused by repeated sync({alter: true}) calls failing to detect existing indexes.");
        }

        // Check columns too
        const [columns] = await db.sequelize.query("DESCRIBE churches");
        console.log("\n--- Columns ---");
        columns.forEach(c => {
            console.log(`${c.Field}: ${c.Type} | Null: ${c.Null} | Key: ${c.Key} | Default: ${c.Default}`);
        });

    } catch (error) {
        console.error("Diagnosis failed:", error);
    } finally {
        await db.sequelize.close();
    }
}

diagnose();
