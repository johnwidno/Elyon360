const db = require('./models');

async function checkDonations() {
    try {
        const churchId = 12;
        const result = await db.Donation.findAll({
            where: { churchId },
            attributes: ['userId', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']],
            group: ['userId']
        });

        console.log('Donation counts by user in church 12:');
        console.log(JSON.stringify(result, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkDonations();
