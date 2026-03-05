const db = require('./models');

async function checkRegistration() {
    try {
        console.log("--- Checking Pending Registrations ---");
        const pending = await db.PendingRegistration.findAll();
        console.log(JSON.stringify(pending, null, 2));

        console.log("\n--- Checking Recent Churches ---");
        const churches = await db.Church.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']]
        });
        console.log(JSON.stringify(churches, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error checking registration:", error);
        process.exit(1);
    }
}

checkRegistration();
