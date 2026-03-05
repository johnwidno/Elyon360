const { sequelize } = require('./models');
const fs = require('fs');

async function checkTable() {
    try {
        const [results] = await sequelize.query('DESCRIBE reservations');
        let out = 'Table: reservations\n';
        results.forEach(r => {
            out += `Field: ${r.Field} | Type: ${r.Type}\n`;
        });
        fs.writeFileSync('reservation_cols.txt', out, 'utf8');
        console.log('Done.');
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

checkTable();
