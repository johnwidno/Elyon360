const db = require('./models');

async function fix() {
    try {
        console.log("Cleaning up group_members indexes...");

        // List of potentially problematic indexes to drop
        const toDrop = [
            'group_members_groupId_userId_unique', // Sequelize auto-generated (incorrect)
            'userId',                             // Old single-column unique
            'unique_group_user'                   // My previous attempt (might need reset)
        ];

        for (const idx of toDrop) {
            try {
                await db.sequelize.query(`ALTER TABLE group_members DROP INDEX ${idx}`);
                console.log(`- Dropped: ${idx}`);
            } catch (e) {
                console.log(`- Skiped: ${idx} (does not exist or error: ${e.message})`);
            }
        }

        console.log("Re-creating correct composite unique index...");
        await db.sequelize.query(`
            ALTER TABLE group_members 
            ADD UNIQUE INDEX unique_group_user (groupId, userId)
        `);
        console.log("SUCCESS!");

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fix();
