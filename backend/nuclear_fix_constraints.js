const db = require('./models');

async function nuclearFix() {
    try {
        console.log("=== NUCLEAR CONSTRAINT FIX ===\n");
        console.log("This will DROP ALL constraints and rebuild from scratch.\n");

        // Step 1: Get all current indexes
        console.log("Step 1: Listing all indexes...");
        const [allIndexes] = await db.sequelize.query("SHOW INDEX FROM group_members");
        console.log(`Found ${allIndexes.length} index entries\n`);

        // Step 2: Drop EVERY unique index (except PRIMARY)
        console.log("Step 2: Dropping ALL unique indexes...");
        const uniqueIndexNames = [...new Set(
            allIndexes
                .filter(i => i.Non_unique === 0 && i.Key_name !== 'PRIMARY')
                .map(i => i.Key_name)
        )];

        if (uniqueIndexNames.length === 0) {
            console.log("   No unique indexes to drop (good!)\n");
        } else {
            for (const indexName of uniqueIndexNames) {
                console.log(`   Dropping: ${indexName}`);
                try {
                    await db.sequelize.query(`ALTER TABLE group_members DROP INDEX \`${indexName}\``);
                    console.log(`   ✓ Dropped successfully`);
                } catch (e) {
                    console.log(`   ✗ Error: ${e.message}`);
                }
            }
            console.log();
        }

        // Step 3: Drop ALL non-unique indexes too (to start clean)
        console.log("Step 3: Dropping all non-unique indexes...");
        const nonUniqueIndexNames = [...new Set(
            allIndexes
                .filter(i => i.Non_unique === 1 && i.Key_name !== 'PRIMARY')
                .map(i => i.Key_name)
        )];

        for (const indexName of nonUniqueIndexNames) {
            console.log(`   Dropping: ${indexName}`);
            try {
                await db.sequelize.query(`ALTER TABLE group_members DROP INDEX \`${indexName}\``);
                console.log(`   ✓ Dropped successfully`);
            } catch (e) {
                console.log(`   ✗ Error: ${e.message}`);
            }
        }
        console.log();

        // Step 4: Create the ONLY correct unique constraint
        console.log("Step 4: Creating THE ONLY CORRECT unique constraint...");
        console.log("   Creating: UNIQUE (groupId, userId)");
        try {
            await db.sequelize.query(`
                ALTER TABLE group_members 
                ADD UNIQUE KEY idx_group_user_unique (groupId, userId)
            `);
            console.log("   ✓ Created successfully\n");
        } catch (e) {
            if (e.message.includes('Duplicate')) {
                console.log("   ⚠️  Index already exists (that's OK)\n");
            } else {
                console.log(`   ✗ Error: ${e.message}\n`);
            }
        }

        // Step 5: Verify final state
        console.log("Step 5: Verifying final state...");
        const [finalIndexes] = await db.sequelize.query("SHOW INDEX FROM group_members");
        const finalUnique = finalIndexes.filter(i => i.Non_unique === 0 && i.Key_name !== 'PRIMARY');

        console.log("\nFinal unique constraints:");
        if (finalUnique.length === 0) {
            console.log("   ⚠️  NO UNIQUE CONSTRAINTS (besides PRIMARY)");
        } else {
            const grouped = {};
            finalUnique.forEach(idx => {
                if (!grouped[idx.Key_name]) grouped[idx.Key_name] = [];
                grouped[idx.Key_name].push(idx.Column_name);
            });

            Object.entries(grouped).forEach(([name, cols]) => {
                console.log(`   - ${name}: [${cols.join(', ')}]`);
            });
        }

        console.log("\n=== FIX COMPLETE ===");
        console.log("Members should now be able to join multiple groups.");
        console.log("IMPORTANT: Restart your backend server for changes to take full effect!");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ FATAL ERROR:", err);
        process.exit(1);
    }
}

nuclearFix();
