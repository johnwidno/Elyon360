const db = require('./models');

async function checkUser411Fields() {
    try {
        const user = await db.User.findByPk(411);
        if (!user) {
            console.log('User 411 NOT FOUND');
        } else {
            console.log('Full User 411 Object from DB:');
            console.log(JSON.stringify(user.toJSON(), null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUser411Fields();
