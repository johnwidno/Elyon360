const db = require('./models');

async function fix() {
    try {
        console.log('Checking for missing columns in visitors table...');
        const [results] = await db.sequelize.query('DESCRIBE visitors');
        const columns = results.map(r => r.Field);

        if (!columns.includes('notes')) {
            console.log('Adding "notes" column...');
            await db.sequelize.query('ALTER TABLE visitors ADD COLUMN notes TEXT NULL');
            console.log('Column "notes" added successfully.');
        } else {
            console.log('Column "notes" already exists.');
        }

        // Also check for viewStatus if it was somehow skipped
        if (!columns.includes('viewStatus')) {
            console.log('Adding "viewStatus" column...');
            await db.sequelize.query("ALTER TABLE visitors ADD COLUMN viewStatus ENUM('not_viewed', 'viewed') DEFAULT 'not_viewed' NOT NULL");
            console.log('Column "viewStatus" added successfully.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Failed to fix schema:', err);
        process.exit(1);
    }
}

fix();
