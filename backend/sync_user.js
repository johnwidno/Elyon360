const db = require('./models');

async function syncUser() {
    try {
        console.log('Forcing User table sync...');
        // Try unsafe sync? Or just retry alter
        await db.User.sync({ alter: true });
        console.log('User table synced.');
        process.exit(0);
    } catch (error) {
        console.error('Error syncing User table:', error);
        process.exit(1);
    }
}

syncUser();
