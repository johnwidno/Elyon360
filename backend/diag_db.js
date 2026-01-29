const db = require('./models');

async function diagnose() {
    try {
        console.log("Diag: Checking DB connection...");
        await db.sequelize.authenticate();
        console.log("Diag: Connection OK.");

        console.log("Diag: Counting Users...");
        const userCount = await db.User.count();
        console.log(`Diag: Users count: ${userCount}`);

        console.log("Diag: Fetching first 5 users (raw: true)...");
        const users = await db.User.findAll({ limit: 5, raw: true });
        console.log(`Diag: Fetched ${users.length} users successfully.`);

        console.log("Diag: Fetching first 5 churches (raw: true)...");
        const churches = await db.Church.findAll({ limit: 5, raw: true });
        console.log(`Diag: Fetched ${churches.length} churches successfully.`);

        process.exit(0);
    } catch (error) {
        console.error("DIAGNOSTIC FAILED:");
        console.error(error);
        process.exit(1);
    }
}

diagnose();
