const db = require('./models');

async function checkUser411Church() {
    try {
        const user = await db.User.findByPk(411);
        if (!user) {
            console.log('User 411 NOT FOUND');
        } else {
            console.log(`User 411: ${user.firstName} ${user.lastName}, Church ID: ${user.churchId}`);
            const church = await db.Church.findByPk(user.churchId);
            if (church) {
                console.log(`Church: ${church.name} (Subdomain: ${church.subdomain})`);
            } else {
                console.log('Church NOT FOUND');
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUser411Church();
