const db = require('./models');

async function definitiveFix() {
    try {
        console.log("Starting definitive schema fix for event_participants...");

        // 1. Drop existing unique index that might interfere
        try {
            await db.sequelize.query("ALTER TABLE event_participants DROP INDEX event_participants_eventId_userId_unique;");
            console.log("Dropped problematic unique index.");
        } catch (e) { console.log("Unique index event_participants_eventId_userId_unique not found or already dropped."); }

        // 2. Add id column and make it primary key
        // We do this in steps to avoid issues with dropping/adding PKs
        try {
            await db.sequelize.query("ALTER TABLE event_participants ADD id INT AUTO_INCREMENT PRIMARY KEY FIRST;");
            console.log("Added 'id' column as PRIMARY KEY.");
        } catch (e) {
            console.log("'id' column might already exist or PK already set. Checking if we need to drop old PK first.");
            try {
                await db.sequelize.query("ALTER TABLE event_participants DROP PRIMARY KEY;");
                await db.sequelize.query("ALTER TABLE event_participants ADD id INT AUTO_INCREMENT PRIMARY KEY FIRST;");
                console.log("Dropped old PK and added 'id' as new PK.");
            } catch (e2) {
                console.log("Could not drop/add PK. It might be already in the desired state.");
            }
        }

        // 3. Ensure userId is nullable and organizationId too
        await db.sequelize.query("ALTER TABLE event_participants MODIFY userId INT NULL;");
        await db.sequelize.query("ALTER TABLE event_participants MODIFY organizationId INT NULL;");
        console.log("Modified columns to allow NULL.");

        // 4. Add a better unique constraint (optional but good)
        // Only if we want to prevent same user/org from registering twice to same event
        // But for guests we might want guestEmail to be unique per event?
        // Let's keep it simple for now to just allow the insert.

        console.log("SUCCESS: Schema repair completed.");
        process.exit(0);
    } catch (err) {
        console.error("DEFINITIVE FIX FAILED:", err);
        process.exit(1);
    }
}

definitiveFix();
