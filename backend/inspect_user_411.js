const db = require('./models');

async function checkUser411() {
    try {
        const user = await db.User.findByPk(411, {
            include: [{ model: db.Church, as: 'church' }]
        });
        console.log(JSON.stringify(user, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUser411();
