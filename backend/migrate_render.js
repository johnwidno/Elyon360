require('dotenv').config();
const db = require('./models');

async function migrateAndSeed() {
    try {
        console.log("🔄 Starting full migration on PostgreSQL...");
        // Synchronize all tables (alter: true va ajouter les colonnes manquantes)
        await db.sequelize.sync({ alter: true });
        console.log("✅ Database schema migrated successfully!");

        console.log("🌱 Starting seeding...");
        // Appelez la fonction de seeding existante
        const seedDB = require('./seed_db');
        await seedDB();

        console.log("🚀 All done! Ready for production.");
    } catch (err) {
        console.error("❌ Migration or Seeding failed:", err);
    } finally {
        process.exit();
    }
}

migrateAndSeed();
