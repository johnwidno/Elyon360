require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../models');
const sundaySchoolController = require('../controllers/sundaySchoolController');

async function sync() {
    try {
        await db.sequelize.authenticate();
        console.log('Connected to DB.');
        
        // Let's assume churchId is 1 based on previous data
        const churchId = 1;
        const users = await db.User.findAll({ where: { churchId }, attributes: ['id'] });

        console.log(`Starting full sync for ${users.length} members in church ${churchId}`);
        let processed = 0;
        for (const user of users) {
            await sundaySchoolController.assignMemberToClasses(user.id, churchId);
            processed++;
        }

        console.log(`Full sync complete: ${processed} members processed.`);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await db.sequelize.close();
    }
}
sync();
