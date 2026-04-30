require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../models');

async function fixClassAndSync() {
    try {
        await db.sequelize.authenticate();
        console.log("Connected to DB.");

        // 1. Update Class 4
        await db.SundaySchool.update(
            { memberCategoryId: null, contactSubtypeId: 44 },
            { where: { id: 4 } }
        );
        console.log("Class 4 updated to use contactSubtypeId: 44 (Candidat au baptême).");

        // 2. Perform global sync for Church 4
        const classes = await db.SundaySchool.findAll({ where: { churchId: 4 } });
        const members = await db.User.findAll({ where: { churchId: 4 } });
        const { assignMemberToClassesInternal } = require('../controllers/sundaySchoolController');

        console.log(`Starting sync for ${members.length} members in church 4...`);
        for (const member of members) {
            await assignMemberToClassesInternal(member, classes, 4);
        }
        console.log("Sync complete!");

        // 3. Print assigned members
        const cls = await db.SundaySchool.findByPk(4, {
            include: [{
                association: 'classMembers',
                attributes: ['id', 'firstName', 'lastName', 'subtypeId', 'memberCategoryId']
            }]
        });

        console.log("Assigned Members to Class 4:");
        console.log(JSON.stringify(cls.classMembers, null, 2));

    } catch (e) {
        console.error(e.message);
    } finally {
        await db.sequelize.close();
    }
}
fixClassAndSync();
