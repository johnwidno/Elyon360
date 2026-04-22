const db = require('./models');

async function resetDatabase() {
    try {
        console.log("🔥 Starting Database Reset...");

        // Force sync will DROP all tables and recreate them
        await db.sequelize.sync({ force: true });

        console.log("✅ Database reset complete!");
        console.log("📋 All tables have been dropped and recreated with the new schema.");
        console.log("🎯 Ready to register a new church with auto-seeded defaults!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Reset Error:", error);
        process.exit(1);
    }
}

resetDatabase();
