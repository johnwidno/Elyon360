const db = require('./models');

async function checkDonations() {
    try {
        const churchId = 12;
        const donations = await db.Donation.findAll({
            where: { churchId },
            attributes: ['id', 'userId', 'amount', 'currency', 'type']
        });

        console.log(`Donations for Church 12:`);
        donations.forEach(d => {
            console.log(`- ID ${d.id}: UserID ${d.userId}, Amount: ${d.amount} ${d.currency}, Type: ${d.type}`);
        });

        const users = await db.User.findAll({
            where: { churchId },
            attributes: ['id', 'firstName', 'lastName']
        });
        console.log('Users in church 12:', users.map(u => u.id));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkDonations();
