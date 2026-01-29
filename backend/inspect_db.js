const db = require('./models');

async function inspect() {
    try {
        const [results] = await db.sequelize.query("SHOW INDEX FROM group_members");
        console.log("Indexes on group_members:");
        results.forEach(idx => {
            console.log(`- ${idx.Key_name}: ${idx.Column_name} (Unique: ${idx.Non_unique === 0})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
