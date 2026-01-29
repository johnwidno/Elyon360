require('dotenv').config();
const mysql = require('mysql2/promise');

async function clean() {
    console.log('Connecting to database...');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected! Cleaning data...');

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DELETE FROM expenses');
        await connection.query('DELETE FROM budgets');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('VICTORY: Budgets and Expenses deleted.');
        await connection.end();
        process.exit(0);
    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    }
}

clean();
