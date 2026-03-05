const db = require('./models');

async function testData() {
    try {
        const churchId = 12;
        const membersCount = await db.User.count({ where: { churchId } });
        console.log(`Church 12 - Members count: ${membersCount}`);

        const donationsCount = await db.Donation.count({ where: { churchId } });
        console.log(`Church 12 - Total donations: ${donationsCount}`);

        const latestDonations = await db.Donation.findAll({
            where: { churchId },
            limit: 5,
            order: [['date', 'DESC']]
        });
        console.log('Latest 5 donations:', JSON.stringify(latestDonations, null, 2));

        const latestNotifs = await db.Notification.findAll({
            where: { churchId },
            limit: 5,
            order: [['createdAt', 'DESC']]
        });
        console.log('Latest 5 notifications:', JSON.stringify(latestNotifs, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

testData();
