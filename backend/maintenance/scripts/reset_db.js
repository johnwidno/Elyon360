const db = require('./models');
const seedDB = require('./seed_db');

async function resetDB() {
    try {
        console.log("Starting database reset...");
        // force: true will drop all tables and recreate them
        await db.sequelize.sync({ force: true });
        console.log("Database reset successfully. Tables recreated.");

        // Seed system data
        await seedDB();

        console.log("Database reset and seeding completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error resetting database:", error);
        process.exit(1);
    }
}

resetDB();
