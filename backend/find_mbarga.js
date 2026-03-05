const db = require('./models');

async function findUser() {
    try {
        const user = await db.User.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { firstName: { [db.Sequelize.Op.iLike]: '%Jean-Daniel%' } },
                    { lastName: { [db.Sequelize.Op.iLike]: '%Mbarga%' } }
                ]
            }
        });

        if (!user) {
            console.log('User Jean-Daniel Mbarga NOT FOUND');
        } else {
            console.log(`Found Jean-Daniel Mbarga (ID: ${user.id}, Church: ${user.churchId})`);
            const dCount = await db.Donation.count({ where: { userId: user.id } });
            console.log(`Donations: ${dCount}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

findUser();
