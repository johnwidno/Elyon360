const db = require('./models');
const fs = require('fs');

async function debugSchema() {
    try {
        console.log("Describing event_participants table...");
        const [results] = await db.sequelize.query("DESCRIBE event_participants;");

        console.log("\nChecking Index/Constraints...");
        const [indexes] = await db.sequelize.query("SHOW INDEX FROM event_participants;");

        const debugInfo = {
            structure: results,
            indexes: indexes
        };

        fs.writeFileSync('schema_debug.json', JSON.stringify(debugInfo, null, 2));
        console.log("Debug info saved to schema_debug.json");
        process.exit(0);
    } catch (err) {
        console.error("DEBUG FAILED:", err);
        process.exit(1);
    }
}

debugSchema();
