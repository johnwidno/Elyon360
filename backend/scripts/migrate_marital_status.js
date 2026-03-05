const db = require('../models');
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Migration script to update maritalStatus ENUM in sunday_schools table
 * Adds 'widowed' and 'divorced' options
 */

async function migrateMaritalStatus() {
    let connection;

    try {
        console.log('🔄 Starting marital status migration...\n');

        // Create direct MySQL connection (bypass Sequelize for ALTER TABLE)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✓ Connected to database');

        // Execute ALTER TABLE
        const sql = `
            ALTER TABLE sunday_schools 
            MODIFY COLUMN maritalStatus 
            ENUM('single', 'married', 'widowed', 'divorced', 'any') 
            DEFAULT 'any'
        `;

        await connection.execute(sql);
        console.log('✓ Updated maritalStatus column\n');

        // Verify the change
        const [rows] = await connection.execute(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'sunday_schools' 
            AND COLUMN_NAME = 'maritalStatus'
        `);

        console.log('📋 Verification:');
        console.log('   Column type:', rows[0].COLUMN_TYPE);
        console.log('\n✅ Migration completed successfully!');

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration error:', error.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

// Run the migration
migrateMaritalStatus();
