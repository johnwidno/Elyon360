require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../models');
const sundaySchoolController = require('../controllers/sundaySchoolController');

async function syncAll() {
    try {
        await db.sequelize.authenticate();
        
        // Find all churches
        const users = await db.User.findAll({ attributes: ['id', 'churchId'] });
        
        // Group users by church
        const churchGroups = {};
        for (const user of users) {
            if (!churchGroups[user.churchId]) {
                churchGroups[user.churchId] = [];
            }
            churchGroups[user.churchId].push(user.id);
        }
        
        for (const [churchId, userIds] of Object.entries(churchGroups)) {
            console.log(`Starting full sync for ${userIds.length} members in church ${churchId}`);
            let processed = 0;
            for (const userId of userIds) {
                await sundaySchoolController.assignMemberToClasses(userId, parseInt(churchId));
                processed++;
            }
            console.log(`Full sync complete: ${processed} members processed for church ${churchId}.`);
        }
        
        const [assignments] = await db.sequelize.query(`
            SELECT "userId", "sundaySchoolId", level
            FROM sunday_school_members
            WHERE "sundaySchoolId" = 4
        `);
        console.log('Class 4 assignments after sync:', assignments);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await db.sequelize.close();
    }
}
syncAll();
