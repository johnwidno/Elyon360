const db = require('./models');

async function checkUserData() {
    try {
        const churchId = 12;
        const users = await db.User.findAll({
            where: { churchId },
            attributes: ['id', 'firstName', 'lastName', 'email']
        });

        console.log(`Users in Church 12:`);
        for (const u of users) {
            const dCount = await db.Donation.count({ where: { userId: u.id } });
            const nCount = await db.Notification.count({ where: { userId: u.id } });
            const rCount = await db.MemberRequest.count({ where: { userId: u.id } });
            console.log(`- ID ${u.id}: ${u.firstName} ${u.lastName} (${u.email}) | Dons: ${dCount}, Notifs: ${nCount}, Requests: ${rCount}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUserData();
