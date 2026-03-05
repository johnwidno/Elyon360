const db = require('../models');
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Migration script to add status, assignmentType, and joinedAt columns
 * to sunday_school_members table
 */

async function migrateSundaySchoolMember() {
    let connection;

    try {
        console.log('🔄 Starting sunday_school_members migration...\n');

        // Create direct MySQL connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✓ Connected to database');

        // Check if columns already exist
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'sunday_school_members' 
            AND TABLE_SCHEMA = ?
        `, [process.env.DB_NAME]);

        const existingColumns = columns.map(c => c.COLUMN_NAME);
        console.log('Existing columns:', existingColumns.join(', '));

        // Add status column if it doesn't exist
        if (!existingColumns.includes('status')) {
            console.log('\n📝 Adding status column...');
            await connection.execute(`
                ALTER TABLE sunday_school_members 
                ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active'
            `);
            console.log('✓ Added status column');
        } else {
            console.log('✓ status column already exists');
        }

        // Add assignmentType column if it doesn't exist
        if (!existingColumns.includes('assignmentType')) {
            console.log('\n📝 Adding assignmentType column...');
            await connection.execute(`
                ALTER TABLE sunday_school_members 
                ADD COLUMN assignmentType ENUM('automatic', 'manual') DEFAULT 'automatic'
            `);
            console.log('✓ Added assignmentType column');
        } else {
            console.log('✓ assignmentType column already exists');
        }

        // Add joinedAt column if it doesn't exist
        if (!existingColumns.includes('joinedAt')) {
            console.log('\n📝 Adding joinedAt column...');
            await connection.execute(`
                ALTER TABLE sunday_school_members 
                ADD COLUMN joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('✓ Added joinedAt column');
        } else {
            console.log('✓ joinedAt column already exists');
        }

        // Verify the changes
        const [newColumns] = await connection.execute(`
            SELECT COLUMN_NAME, COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'sunday_school_members' 
            AND COLUMN_NAME IN ('status', 'assignmentType', 'joinedAt')
        `);

        console.log('\n📋 Verification:');
        newColumns.forEach(col => {
            console.log(`   ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
        });

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
migrateSundaySchoolMember();
