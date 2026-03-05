const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Migration: Adding memberStatus to sunday_schools ---');

        // Add memberStatus column
        const [columns] = await connection.execute('SHOW COLUMNS FROM sunday_schools LIKE "memberStatus"');
        if (columns.length === 0) {
            await connection.execute('ALTER TABLE sunday_schools ADD COLUMN memberStatus VARCHAR(50) DEFAULT "any" AFTER activeOnly');
            console.log('✅ Column memberStatus added.');

            // Migrate existing activeOnly data
            await connection.execute('UPDATE sunday_schools SET memberStatus = "Actif" WHERE activeOnly = 1');
            console.log('✅ Migrated activeOnly data to memberStatus.');
        } else {
            console.log('ℹ️ Column memberStatus already exists.');
        }

        console.log('--- Migration completed successfully ---');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await connection.end();
    }
}

migrate();
