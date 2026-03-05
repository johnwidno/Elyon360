const db = require('./models');

async function checkColumnExistence() {
    try {
        const columns = await db.sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'baptismDate';
        `);
        console.log('Columns found:', JSON.stringify(columns[0], null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkColumnExistence();
