const db = require('./models');

async function cleanChurchIndexes() {
    try {
        console.log("=== CLEANING CHURCHES TABLE INDEXES ===\n");

        // Step 1: List all indexes
        console.log("Step 1: Listing all indexes on churches table...");
        const [indexes] = await db.sequelize.query("SHOW INDEX FROM churches");

        const grouped = {};
        indexes.forEach(idx => {
            if (!grouped[idx.Key_name]) {
                grouped[idx.Key_name] = { cols: [], unique: idx.Non_unique === 0 };
            }
            grouped[idx.Key_name].cols.push(idx.Column_name);
        });

        console.log(`Found ${Object.keys(grouped).length} indexes:`);
        Object.entries(grouped).forEach(([name, info]) => {
            const type = info.unique ? 'UNIQUE' : 'INDEX';
            console.log(`   ${type} ${name}: [${info.cols.join(', ')}]`);
        });
        console.log();

        // Step 2: Identify indexes to keep
        const indexesToKeep = [
            'PRIMARY',
            'subdomain', // Keep unique on subdomain
            'customDomain' // Keep unique on customDomain
        ];

        // Step 3: Drop all other indexes
        console.log("Step 2: Dropping unnecessary indexes...");
        let droppedCount = 0;

        for (const [indexName, info] of Object.entries(grouped)) {
            if (!indexesToKeep.includes(indexName)) {
                try {
                    await db.sequelize.query(`ALTER TABLE churches DROP INDEX \`${indexName}\``);
                    console.log(`   ✓ Dropped: ${indexName}`);
                    droppedCount++;
                } catch (e) {
                    console.log(`   ✗ Error dropping ${indexName}: ${e.message}`);
                }
            } else {
                console.log(`   - Kept: ${indexName}`);
            }
        }

        console.log(`\nDropped ${droppedCount} unnecessary indexes\n`);

        // Step 4: Final verification
        console.log("Step 3: Final verification...");
        const [finalIndexes] = await db.sequelize.query("SHOW INDEX FROM churches");
        const finalGrouped = {};
        finalIndexes.forEach(idx => {
            if (!finalGrouped[idx.Key_name]) {
                finalGrouped[idx.Key_name] = { cols: [], unique: idx.Non_unique === 0 };
            }
            finalGrouped[idx.Key_name].cols.push(idx.Column_name);
        });

        console.log(`\nFinal state: ${Object.keys(finalGrouped).length} indexes remaining:`);
        Object.entries(finalGrouped).forEach(([name, info]) => {
            const type = info.unique ? 'UNIQUE' : 'INDEX';
            console.log(`   ${type} ${name}: [${info.cols.join(', ')}]`);
        });

        console.log("\n=== CLEANUP COMPLETE ===");
        console.log("✅ Churches table is now clean!");
        console.log("✅ Server should start successfully now.");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ FATAL ERROR:", err);
        process.exit(1);
    }
}

cleanChurchIndexes();
