const db = require('./models');

async function testProfileQuery() {
    try {
        const userId = 411; // John Widno Dorcy
        const user = await db.User.findByPk(userId, {
            attributes: { exclude: ['password'] },
            include: [
                { model: db.Church, as: 'church', attributes: ['name', 'subdomain', 'acronym', 'adminEmail'] },
                { model: db.ContactSubtype, as: 'contactSubtype', attributes: ['name'] },
                { model: db.Group, as: 'memberGroups', attributes: ['id', 'name', 'type', 'description'] },
                { model: db.SundaySchool, as: 'sundaySchoolClasses', attributes: ['id', 'name', 'description'] },
                { model: db.User, as: 'registrant', attributes: ['firstName', 'lastName'] }
            ]
        });
        if (!user) {
            console.log('User 411 not found');
        } else {
            console.log('Success! Found user');
        }
    } catch (err) {
        console.error('DATABASE ERROR DETECTED:');
        console.error(err);
    } finally {
        process.exit();
    }
}

testProfileQuery();
