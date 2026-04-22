const db = require('./models');

async function testProfileQuery() {
    try {
        const userId = 411;
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
        console.log('Success! Found user');
    } catch (err) {
        console.error('DATABASE ERROR DETECTED:');
        console.error(err.message);
        if (err.parent) console.error('PARENT ERROR:', err.parent.message);
    } finally {
        process.exit();
    }
}

testProfileQuery();
