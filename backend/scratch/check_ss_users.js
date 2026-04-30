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
        const [users] = await sequelize.query(`
            SELECT id, "firstName", "lastName", "memberCategoryId", "subtypeId", "baptismalStatus"
            FROM users
            WHERE "memberCategoryId" = 20 OR "subtypeId" = 20 OR "baptismalStatus" IN ('candidate', 'not_baptized')
            LIMIT 10
        `);
        console.log('Sample Users:', users);
        
        const [assignments] = await sequelize.query(`
            SELECT "userId", "sundaySchoolId", level
            FROM sunday_school_members
            WHERE "sundaySchoolId" = 4
        `);
        console.log('Class 4 assignments:', assignments);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
    }
}
check();
