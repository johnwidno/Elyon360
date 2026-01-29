const db = require('./models');

async function run() {
    try {
        const [results] = await db.sequelize.query("SHOW CREATE TABLE group_members");
        console.log("CREATE TABLE Statement:");
        console.log(results[0]['Create Table']);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
