const db = require('./models');

async function checkUserStats() {
    try {
        const userId = 411; // Assuming this is the current user since it's the most common in recent logs
        const donations = await db.Donation.findAll({ where: { userId } });
        const notifications = await db.Notification.findAll({ where: { userId } });
        const requests = await db.MemberRequest.findAll({ where: { userId } });
        const user = await db.User.findByPk(userId);

        console.log(`Stats for user ${userId} (${user ? user.firstName + ' ' + user.lastName : 'NOT FOUND'}):`);
        console.log(`- Donations: ${donations.length}`);
        console.log(`- Notifications: ${notifications.length}`);
        console.log(`- Requests: ${requests.length}`);

        if (donations.length > 0) {
            console.log('Sample donation:', JSON.stringify(donations[0], null, 2));
        }

        // Check if there are unassigned donations in church 12
        if (user) {
            const unassigned = await db.Donation.count({ where: { churchId: user.churchId, userId: null } });
            console.log(`Unassigned donations in church ${user.churchId}: ${unassigned}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUserStats();
