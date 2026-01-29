const db = require('./models');

async function checkOrgs() {
    try {
        const churches = await db.Church.findAll();
        console.log(`--- Churches (${churches.length}) ---`);
        churches.forEach(c => console.log(`ID: ${c.id}, Name: "${c.name}", Subdomain: "${c.subdomain}"`));

        const orgs = await db.Organization.findAll({
            include: [{ model: db.Church, as: 'church' }]
        });

        console.log(`\n--- Organizations (${orgs.length}) ---`);
        orgs.forEach(o => {
            console.log(`ID: ${o.id}, Name: "${o.name}", ChurchID: ${o.churchId}, BelongsToChurch: "${o.church?.name || 'N/A'}", isSystem: ${o.isSystem}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error checking data:", error);
        process.exit(1);
    }
}

checkOrgs();
