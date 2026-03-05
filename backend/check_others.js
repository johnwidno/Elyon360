const db = require('./models');

async function checkOtherTables() {
    try {
        if (db.Visitor) {
            const vGenders = await db.Visitor.findAll({
                attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('gender')), 'gender']],
                raw: true
            });
            console.log("Visitor Genders:", vGenders.map(g => g.gender));
        }

        if (db.SundaySchoolMember) {
            const ssGenders = await db.SundaySchoolMember.findAll({
                attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('gender')), 'gender']],
                raw: true
            });
            console.log("Sunday School Member Genders:", ssGenders.map(g => g.gender));
        }

        // Check if there is a 'G' or 'F' in User table specifically
        const gUsers = await db.User.count({ where: { gender: 'G' } });
        const fUsers = await db.User.count({ where: { gender: 'F' } });
        console.log(`User Table - G: ${gUsers}, F: ${fUsers}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkOtherTables();
