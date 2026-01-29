const db = require('./models');
const sundaySchoolController = require('./controllers/sundaySchoolController');
const fs = require('fs');

async function verify() {
    try {
        let output = "--- Verifying Robust Matching (UI Strings) ---\n";

        const church = await db.Church.findOne();
        if (!church) {
            fs.writeFileSync('verify_log.txt', "No church found");
            return;
        }

        // 1. Create the class from user example
        const youthMarriedClass = await db.SundaySchool.create({
            churchId: church.id,
            name: "Classe des jeunne mariee",
            minAge: 20,
            maxAge: 40,
            maritalStatus: 'married',
            baptismalStatus: 'baptized',
            activeOnly: true,
            isDynamic: true
        });

        // 2. Setup a user matching the UI values
        const user = await db.User.findOne({ where: { churchId: church.id } });
        await user.update({
            gender: 'F', // From UI
            maritalStatus: 'Marié(e)', // From UI
            baptismalStatus: 'baptized', // From DB enum
            status: 'Actif', // From UI
            birthDate: '2000-01-01' // Age 26
        });

        await sundaySchoolController.assignMemberToClasses(user.id, church.id);
        let assignments = await db.SundaySchoolMember.findAll({ where: { userId: user.id, sundaySchoolId: youthMarriedClass.id } });
        const success = assignments.length > 0;
        output += `User Assigned to "Classe des jeunne mariee": ${success ? 'YES (Correct)' : 'NO (Incorrect)'}\n`;

        // Cleanup
        await youthMarriedClass.destroy();
        fs.writeFileSync('verify_log.txt', output);

    } catch (error) {
        fs.writeFileSync('verify_log.txt', error.stack);
    } finally {
        process.exit();
    }
}

verify();
