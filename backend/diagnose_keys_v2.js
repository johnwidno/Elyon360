const db = require('./models');

async function diagnose() {
    try {
        console.log("START_DIAGNOSIS");
        const [results] = await db.sequelize.query("SHOW INDEX FROM churches");
        console.log("INDEX_COUNT:" + results.length);

        results.forEach(r => {
            console.log(`INDEX_NAME:${r.Key_name} | COLUMN:${r.Column_name} | UNIQUE:${r.Non_unique === 0}`);
        });

        const [columns] = await db.sequelize.query("DESCRIBE churches");
        columns.forEach(c => {
            console.log(`COLUMN:${c.Field} | KEY:${c.Key}`);
        });
        console.log("END_DIAGNOSIS");
    } catch (error) {
        console.error("DIAGNOSIS_ERROR:", error);
    } finally {
        await db.sequelize.close();
    }
}

diagnose();
