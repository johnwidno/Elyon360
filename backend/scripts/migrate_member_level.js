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
        console.log('--- Migration: Adding level and leftAt to sunday_school_members ---');

        // Add level column
        const [levelColumn] = await connection.execute('SHOW COLUMNS FROM sunday_school_members LIKE "level"');
        if (levelColumn.length === 0) {
            await connection.execute('ALTER TABLE sunday_school_members ADD COLUMN level VARCHAR(50) DEFAULT "Actuel" AFTER assignmentType');
            console.log('✅ Column "level" added.');

            // Migrate existing status to level
            const [statusColumn] = await connection.execute('SHOW COLUMNS FROM sunday_school_members LIKE "status"');
            if (statusColumn.length > 0) {
                await connection.execute('UPDATE sunday_school_members SET level = "Actuel" WHERE status = "active"');
                await connection.execute('UPDATE sunday_school_members SET level = "non-actuel" WHERE status = "inactive"');
                console.log('✅ Migrated data from "status" to "level".');
            }
        }

        // Add leftAt column
        const [leftAtColumn] = await connection.execute('SHOW COLUMNS FROM sunday_school_members LIKE "leftAt"');
        if (leftAtColumn.length === 0) {
            await connection.execute('ALTER TABLE sunday_school_members ADD COLUMN leftAt DATETIME NULL AFTER joinedAt');
            console.log('✅ Column "leftAt" added.');
        }

        console.log('--- Migration completed successfully ---');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await connection.end();
    }
}

migrate();
