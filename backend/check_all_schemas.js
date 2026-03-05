const db = require('./models');

async function checkAllSchemas() {
    console.log("Starting Global Schema Integrity Check...");
    const models = Object.keys(db).filter(key => db[key].sequelize && key !== 'sequelize' && key !== 'Sequelize');

    for (const modelName of models) {
        const model = db[modelName];
        const tableName = model.getTableName();

        try {
            console.log(`\nChecking model: ${modelName} (Table: ${tableName})`);
            const [columns] = await db.sequelize.query(`SHOW COLUMNS FROM ${typeof tableName === 'object' ? tableName.tableName : tableName}`);
            const dbFields = columns.map(c => c.Field);
            const modelFields = Object.keys(model.rawAttributes);

            const missingInDb = modelFields.filter(f => !dbFields.includes(f));

            if (missingInDb.length > 0) {
                console.error(`!!! MISSING COLUMNS in ${tableName}: ${missingInDb.join(', ')}`);
            } else {
                console.log(`[OK] All ${modelFields.length} fields exist.`);
            }
        } catch (error) {
            console.error(`Error checking ${modelName}:`, error.message);
        }
    }
    process.exit(0);
}

checkAllSchemas();
