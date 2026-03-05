require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ekklesia360_db',
            multipleStatements: true
        });

        console.log('✅ Connected to database');

        // Read SQL file
        const sqlFile = path.join(__dirname, 'apply_visitor_migration.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('📄 Executing migration script...');

        // Execute the migration
        await connection.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('The visitors table has been updated with:');
        console.log('  • firstName and lastName (replacing fullName)');
        console.log('  • description field');
        console.log('  • wantsMembership boolean');
        console.log('  • viewStatus enum (not_viewed, viewed)');
        console.log('  • convertedToMemberId reference');
        console.log('');
        console.log('All existing visitor data has been migrated.');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('');
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
