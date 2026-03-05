const { sequelize } = require('./models');

async function checkTable() {
    try {
        const [results] = await sequelize.query('DESCRIBE inventory_items');
        console.log('COLUMN_LIST_START');
        results.forEach(r => {
            console.log(`COLUMN: ${r.Field} | TYPE: ${r.Type}`);
        });
        console.log('COLUMN_LIST_END');
    } catch (err) {
        console.error('Error describing table:', err);
    }
    process.exit(0);
}

checkTable();
