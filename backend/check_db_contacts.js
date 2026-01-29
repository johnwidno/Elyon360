const db = require('./models');

async function checkData() {
    try {
        const allTypes = await db.ContactType.findAll({
            attributes: [[db.Sequelize.fn('DISTINCT', db.Sequelize.col('name')), 'name']]
        });
        console.log("--- Unique Contact Type Names in DB ---");
        allTypes.forEach(t => console.log(`"${t.name}"`));

        const types = await db.ContactType.findAll({
            include: [{ model: db.ContactSubtype, as: 'subtypes' }]
        });

        console.log("--- Contact Types Summary ---");
        types.forEach(t => {
            console.log(`Type: "${t.name}" (ID: ${t.id}, ChurchID: ${t.churchId})`);
            console.log(`  Subtypes (${t.subtypes.length}): ${t.subtypes.map(s => s.name).join(', ')}`);
        });

        const churchCount = await db.Church.count();
        console.log(`\nTotal Churches: ${churchCount}`);

        process.exit(0);
    } catch (error) {
        console.error("Error checking data:", error);
        process.exit(1);
    }
}

checkData();
