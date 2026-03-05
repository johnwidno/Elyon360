const db = require('./models');
const migration = require('./migrations/add_notes_to_visitors');

async function run() {
    try {
        console.log('Running manual migration: Add notes to visitors');
        const queryInterface = db.sequelize.getQueryInterface();
        await migration.up(queryInterface);
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();
