const db = require('./models');

async function fixUserTable() {
    try {
        console.log('Adding "baptismDate" to "users" table...');
        await db.sequelize.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "baptismDate" DATE;');
        console.log('Success! Column added (or already existed).');
    } catch (err) {
        console.error('Error adding column:', err.message);
    } finally {
        process.exit();
    }
}

fixUserTable();
