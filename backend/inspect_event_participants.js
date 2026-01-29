const db = require('./models');

async function inspect() {
    try {
        const [results] = await db.sequelize.query("SHOW INDEX FROM event_participants");
        console.log("Indexes on event_participants:");
        results.forEach(idx => {
            console.log(`- ${idx.Key_name}: ${idx.Column_name} (Unique: ${idx.Non_unique === 0})`);
        });

        const [createTable] = await db.sequelize.query("SHOW CREATE TABLE event_participants");
        console.log("\nCreate Table SQL:");
        console.log(createTable[0]['Create Table']);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
