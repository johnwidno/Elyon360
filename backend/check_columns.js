const db = require('./models');

async function checkColumns() {
    try {
        await db.sequelize.authenticate();
        console.log('Connection established.');

        const [results, metadata] = await db.sequelize.query("SHOW COLUMNS FROM buildings");
        console.log("Columns in 'buildings' table:");
        results.forEach(col => {
            console.log(` - ${col.Field} (${col.Type})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.sequelize.close();
    }
}

checkColumns();
