const db = require('./models');
const fs = require('fs');

async function testProfileQuery() {
    try {
        const userId = 411;
        const user = await db.User.findByPk(userId, {
            attributes: { exclude: ['password'] },
            include: [
                { model: db.Church, as: 'church', attributes: ['name', 'subdomain', 'acronym'] },
                { model: db.ContactSubtype, as: 'contactSubtype', attributes: ['name'] },
                { model: db.Group, as: 'memberGroups', attributes: ['id', 'name', 'type', 'description'] },
                { model: db.SundaySchool, as: 'sundaySchoolClasses', attributes: ['id', 'name', 'description'] },
                { model: db.User, as: 'registrant', attributes: ['firstName', 'lastName'] }
            ]
        });
        fs.writeFileSync('query_result.txt', 'Success! Found user\n' + JSON.stringify(user.toJSON(), null, 2));
    } catch (err) {
        let msg = 'DATABASE ERROR DETECTED:\n' + err.message + '\n';
        if (err.parent) msg += 'PARENT ERROR: ' + err.parent.message + '\n';
        if (err.sql) msg += 'SQL: ' + err.sql + '\n';
        fs.writeFileSync('query_result.txt', msg);
    } finally {
        process.exit();
    }
}

testProfileQuery();
