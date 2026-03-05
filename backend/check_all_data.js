const db = require('./models');

async function checkAllGenders() {
    try {
        const genders = await db.User.findAll({
            attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('gender')), 'gender']],
            raw: true
        });
        console.log("All Distinct Genders in DB:", genders.map(g => g.gender));

        const subtypes = await db.ContactSubtype.findAll({
            attributes: ['id', 'name'],
            limit: 20
        });
        console.log("Subtypes:", subtypes.map(s => `${s.id}: ${s.name}`));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkAllGenders();
