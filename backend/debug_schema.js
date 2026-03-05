const db = require('./models');
const fs = require('fs');

async function check() {
    try {
        const [results] = await db.sequelize.query('DESCRIBE visitors');
        fs.writeFileSync('schema_debug.json', JSON.stringify(results, null, 2));
        console.log('Schema written to schema_debug.json');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
