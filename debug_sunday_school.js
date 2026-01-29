const db = require("./backend/models");

async function check() {
    try {
        const users = await db.User.findAll({
            limit: 20,
            attributes: ['id', 'firstName', 'lastName', 'baptismalStatus']
        });
        console.log("=== Users Baptismal Status ===");
        users.forEach(u => console.log(`${u.id}: ${u.firstName} ${u.lastName} -> [${u.baptismalStatus}]`));

        const classes = await db.SundaySchool.findAll({
            attributes: ['id', 'name', 'baptismalStatus', 'isDynamic']
        });
        console.log("\n=== Classes Criteria ===");
        classes.forEach(c => console.log(`${c.id}: ${c.name} -> [${c.baptismalStatus}] (Dynamic: ${c.isDynamic})`));

        const assignments = await db.SundaySchoolMember.findAll({
            limit: 50
        });
        console.log("\n=== Assignments ===");
        assignments.forEach(m => console.log(`User ${m.userId} in Class ${m.sundaySchoolId}, Type: [${m.assignmentType}]`));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
