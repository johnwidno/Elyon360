require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Add contactSubtypeId column (contact classification criterion)
        await sequelize.query(
            'ALTER TABLE sunday_schools ADD COLUMN IF NOT EXISTS "contactSubtypeId" INTEGER DEFAULT NULL'
        );
        console.log('SUCCESS: "contactSubtypeId" column added to sunday_schools.');
    } catch (err) {
        console.error('Migration Error:', err.message);
    } finally {
        await sequelize.close();
    }
}

migrate();
