const db = require('./models');

async function searchAnywhere() {
    try {
        const users = await db.User.findAll({
            where: {
                [db.Sequelize.Op.or]: [
                    { firstName: { [db.Sequelize.Op.iLike]: '%Jean-Daniel%' } },
                    { lastName: { [db.Sequelize.Op.iLike]: '%Mbarga%' } }
                ]
            },
            include: [{ model: db.Church, as: 'church' }]
        });

        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Name: ${u.firstName} ${u.lastName}, Church: ${u.church ? u.church.name : 'NONE'} (ID: ${u.churchId})`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

searchAnywhere();
