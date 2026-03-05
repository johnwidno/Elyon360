const db = require('./models');

async function checkValues() {
    try {
        const users = await db.User.findAll({
            attributes: ['firstName', 'lastName', 'gender', 'role', 'subtypeId'],
            limit: 20
        });
        console.log("Sample User Records:");
        users.forEach(u => {
            console.log(`Name: ${u.firstName} ${u.lastName}, Gender: ${u.gender}, Role: ${JSON.stringify(u.role)}, SubtypeId: ${u.subtypeId}`);
        });

        const genders = await db.User.findAll({
            attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('gender')), 'gender']],
            raw: true
        });
        console.log("\nDistinct Genders:", genders.map(g => g.gender));

        const roles = await db.User.findAll({
            attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('role')), 'role']],
            raw: true
        });
        console.log("Distinct Roles (Raw Text):", roles.map(r => r.role));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkValues();
