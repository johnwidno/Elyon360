const db = require('./models');

async function syncDb() {
    try {
        console.log('Syncing database...');
        // Use alter: true to update the column type from STRING to TEXT
        await db.sequelize.sync({ alter: true });
        console.log('Database synced successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error syncing database:', error);
        process.exit(1);
    }
}

syncDb();
