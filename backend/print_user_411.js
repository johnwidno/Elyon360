const db = require('./models');

async function checkUser411Fields() {
    try {
        const user = await db.User.findByPk(411);
        if (!user) {
            console.log('User 411 NOT FOUND');
        } else {
            const fields = [
                'firstName', 'lastName', 'email', 'phone', 'birthDate',
                'address', 'city', 'baptismDate', 'baptismalStatus',
                'joinDate', 'nifCin', 'memberCode'
            ];
            console.log('User 411 Fields:');
            fields.forEach(f => {
                console.log(`${f}: ${user[f]}`);
            });
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUser411Fields();
