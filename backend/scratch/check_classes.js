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
        const [classes] = await sequelize.query(`
            SELECT ss.id, ss.name, ss."churchId", count(ssm."userId") as count
            FROM sunday_schools ss 
            LEFT JOIN sunday_school_members ssm ON ss.id = ssm."sundaySchoolId" 
            GROUP BY ss.id, ss.name, ss."churchId"
            ORDER BY ss.id
        `);
        console.log('Classes:', classes);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
    }
}
check();
