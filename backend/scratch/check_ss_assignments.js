require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres', logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function check() {
    try {
        await sequelize.authenticate();

        // 1. All classes and their member counts
        const [classes] = await sequelize.query(`
            SELECT ss.id, ss.name, ss."memberCategoryId", ss."baptismalStatus", ss."isDynamic",
                   COUNT(ssm.id) FILTER (WHERE ssm.level = 'Actuel') AS active_count,
                   COUNT(ssm.id) FILTER (WHERE ssm.level = 'non-actuel') AS archived_count
            FROM sunday_schools ss
            LEFT JOIN sunday_school_members ssm ON ssm."sundaySchoolId" = ss.id
            GROUP BY ss.id, ss.name
            ORDER BY ss.name
        `);
        console.log('\n=== CLASSES ===');
        classes.forEach(c => console.log(`  [${c.id}] ${c.name} | isDynamic:${c.isDynamic} | baptismalStatus:${c.baptismalStatus} | memberCategoryId:${c.memberCategoryId} | active:${c.active_count} | archived:${c.archived_count}`));

        // 2. Show all member assignments (Actuel + non-actuel)
        const [members] = await sequelize.query(`
            SELECT ssm.id, ssm."userId", u."firstName", u."lastName", ssm."sundaySchoolId", ss.name AS class_name,
                   ssm.level, ssm."assignmentType", ssm."joinedAt", ssm."leftAt"
            FROM sunday_school_members ssm
            JOIN sunday_schools ss ON ss.id = ssm."sundaySchoolId"
            JOIN users u ON u.id = ssm."userId"
            ORDER BY ss.name, ssm.level, u."lastName"
        `);
        console.log('\n=== MEMBER ASSIGNMENTS ===');
        members.forEach(m => console.log(`  ${m.firstName} ${m.lastName} | Class: ${m.class_name} | Level: ${m.level} | Type: ${m.assignmentType}`));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await sequelize.close();
    }
}

check();
