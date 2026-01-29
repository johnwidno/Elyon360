const db = require('./models');

async function checkModels() {
    try {
        console.log("Checking DB Connection and Models...");
        await db.sequelize.authenticate();
        console.log("Database connection OK.");

        const models = ['User', 'Church', 'Visitor', 'Donation', 'Plan'];
        models.forEach(m => {
            if (db[m]) {
                console.log(`Model ${m}: Defined`);
            } else {
                console.error(`Model ${m}: UNDEFINED (CRITICAL)`);
            }
        });

        // Test a count query
        const count = await db.User.count();
        console.log(`User count: ${count}`);

    } catch (error) {
        console.error("Error during verification:", error);
    } finally {
        process.exit();
    }
}

checkModels();
