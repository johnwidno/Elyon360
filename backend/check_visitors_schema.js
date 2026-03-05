const db = require('./models');

async function check() {
    try {
        const [results] = await db.sequelize.query('DESCRIBE visitors');
        console.log('Columns in visitors table:');
        results.forEach(col => {
            console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error describing table:', err);
        process.exit(1);
    }
}

check();
