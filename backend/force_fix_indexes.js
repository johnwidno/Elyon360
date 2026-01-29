const db = require('./models');

async function run() {
    try {
        console.log("Fixing group_members indexes...");

        // 1. Get all indexes
        const [indexes] = await db.sequelize.query("SHOW INDEX FROM group_members");

        // 2. Filter unique indexes that are not PRIMARY
        const uniqueIndexes = [...new Set(indexes.filter(i => i.Non_unique === 0 && i.Key_name !== 'PRIMARY').map(i => i.Key_name))];

        console.log("Found unique indexes:", uniqueIndexes);

        for (const idx of uniqueIndexes) {
            try {
                await db.sequelize.query(`ALTER TABLE group_members DROP INDEX \`${idx}\``);
                console.log(`- Dropped: ${idx}`);
            } catch (e) {
                console.log(`- Failed to drop ${idx}: ${e.message}`);
            }
        }

        // 3. Create the correct composite unique index
        console.log("Creating correct composite unique index (groupId, userId)...");
        await db.sequelize.query(`
            ALTER TABLE group_members 
            ADD UNIQUE INDEX \`unique_group_member_user\` (groupId, userId)
        `);

        console.log("DONE! The system should now allow a member to be in multiple groups, but only once per group.");
        process.exit(0);
    } catch (err) {
        console.error("FATAL ERROR:", err);
        process.exit(1);
    }
}

run();
