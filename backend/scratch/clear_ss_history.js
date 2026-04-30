const db = require('../models');

async function clearSundaySchoolHistory() {
    try {
        console.log('--- CLEARING SUNDAY SCHOOL ASSIGNMENTS ---');
        
        // Delete all records in SundaySchoolMember table
        const deletedCount = await db.SundaySchoolMember.destroy({
            where: {},
            truncate: false // Truncate might fail due to FK, so we use where: {}
        });

        console.log(`Successfully deleted ${deletedCount} assignment records.`);
        
        // Optional: Also clear attendance if history is linked to that
        // const deletedAttendance = await db.SundaySchoolAttendance.destroy({ where: {} });
        // console.log(`Successfully deleted ${deletedAttendance} attendance records.`);

        process.exit(0);
    } catch (error) {
        console.error('Error clearing Sunday School history:', error);
        process.exit(1);
    }
}

clearSundaySchoolHistory();
