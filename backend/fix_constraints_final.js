const db = require('./models');

async function run() {
    try {
        console.log("=== ANALYSING group_members TABLE CONSTRAINTS ===\n");

        // 1. Show create table
        console.log("1. Current CREATE TABLE statement:");
        const [createResults] = await db.sequelize.query("SHOW CREATE TABLE group_members");
        console.log(createResults[0]['Create Table']);
        console.log("\n");

        // 2. Show all indexes
        console.log("2. All indexes on group_members:");
        const [indexes] = await db.sequelize.query("SHOW INDEX FROM group_members");
        indexes.forEach(idx => {
            console.log(`   - ${idx.Key_name}: Column=${idx.Column_name}, Unique=${idx.Non_unique === 0}, Seq=${idx.Seq_in_index}`);
        });
        console.log("\n");

        // 3. Identify and drop incorrect unique indexes
        console.log("3. Dropping ALL unique indexes (except PRIMARY)...");
        const uniqueIndexNames = [...new Set(
            indexes
                .filter(i => i.Non_unique === 0 && i.Key_name !== 'PRIMARY')
                .map(i => i.Key_name)
        )];

        for (const idxName of uniqueIndexNames) {
            try {
                await db.sequelize.query(`ALTER TABLE group_members DROP INDEX \`${idxName}\``);
                console.log(`   ✓ Dropped: ${idxName}`);
            } catch (e) {
                console.log(`   ✗ Failed to drop ${idxName}: ${e.message}`);
            }
        }
        console.log("\n");

        // 4. Create the correct composite unique index
        console.log("4. Creating CORRECT composite unique constraint...");
        try {
            await db.sequelize.query(`
                ALTER TABLE group_members 
                ADD UNIQUE INDEX idx_unique_group_user (groupId, userId)
            `);
            console.log("   ✓ Created composite unique index: idx_unique_group_user (groupId, userId)");
        } catch (e) {
            console.log(`   ✗ Error: ${e.message}`);
        }
        console.log("\n");

        // 5. Verify the fix
        console.log("5. Final verification - indexes after fix:");
        const [finalIndexes] = await db.sequelize.query("SHOW INDEX FROM group_members");
        finalIndexes.forEach(idx => {
            console.log(`   - ${idx.Key_name}: Column=${idx.Column_name}, Unique=${idx.Non_unique === 0}, Seq=${idx.Seq_in_index}`);
        });

        console.log("\n=== FIX COMPLETE ===");
        console.log("A member can now be in multiple groups (A, B, C...) but only once per group.");

        process.exit(0);
    } catch (err) {
        console.error("FATAL ERROR:", err);
        process.exit(1);
    }
}

run();
