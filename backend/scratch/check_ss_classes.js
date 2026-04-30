require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres', logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

async function check() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');
        const [classes] = await sequelize.query(`
            SELECT id, name, "baptismalStatus", "memberCategoryId", "contactSubtypeId", "isDynamic"
            FROM sunday_schools
        `);
        console.log('Classes:', classes);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
    }
}
check();
