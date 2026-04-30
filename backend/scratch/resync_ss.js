const db = require('../models');
const sundaySchoolController = require('../controllers/sundaySchoolController');

async function resyncAllMembers() {
    try {
        console.log('--- RE-SYNCING ALL SUNDAY SCHOOL ASSIGNMENTS ---');
        
        const users = await db.User.findAll();
        console.log(`Found ${users.length} users to process.`);

        for (const user of users) {
            console.log(`Processing user: ${user.firstName} ${user.lastName} (ID: ${user.id}, Church: ${user.churchId})`);
            await sundaySchoolController.assignMemberToClasses(user.id, user.churchId);
        }

        console.log('--- RE-SYNC COMPLETE ---');
        process.exit(0);
    } catch (error) {
        console.error('Error during re-sync:', error);
        process.exit(1);
    }
}

resyncAllMembers();
