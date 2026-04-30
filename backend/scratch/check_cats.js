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
        const [cats] = await sequelize.query('SELECT * FROM member_categories WHERE id = 20');
        console.log('Category 20:', cats);
        const [subs] = await sequelize.query('SELECT * FROM contact_subtypes');
        console.log('Subtypes:', subs.map(s => `${s.id}: ${s.name}`).join(', '));
    } catch (e) {
        console.error(e.message);
    } finally {
        await sequelize.close();
    }
}
check();
