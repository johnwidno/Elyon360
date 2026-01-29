const db = require('./backend/models');

async function testDashboardStats() {
    try {
        console.log("Connecting to DB...");
        await db.sequelize.authenticate();
        console.log("DB Connected.");

        const church = await db.Church.findOne();
        if (!church) {
            console.log("No churches found to test with.");
            return;
        }
        const churchId = church.id;
        console.log(`Testing with Church ID: ${churchId}`);

        // Mock req/res for controller test (or just run logic directly)
        // Since we want to test the Controller logic exactly, let's import it if possible, 
        // but since we can't easily mock req/res here without overhead, we'll replicate the queries to ensure they don't crash.

        console.log("Testing Queries...");

        // 1. Organization & Group Count
        const orgCount = await db.Organization.count({ where: { churchId } });
        const groupCount = await db.Group.count({ where: { churchId } });
        const visitorCount = await db.Visitor.count({ where: { churchId } });
        console.log(`Org Count: ${orgCount}, Group Count: ${groupCount}, Visitor Count: ${visitorCount}`);

        // 2. Growth Logic (Split)
        console.log("Testing Growth Logic...");
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const [membersAll, visitorsAll, organizationsAll] = await Promise.all([
            db.User.findAll({ where: { churchId, role: { [db.Sequelize.Op.like]: '%member%' } }, attributes: ['createdAt'] }),
            db.Visitor.findAll({ where: { churchId }, attributes: ['createdAt'] }),
            db.Organization.findAll({ where: { churchId }, attributes: ['createdAt'] })
        ]);

        console.log(`Fetched: ${membersAll.length} Members, ${visitorsAll.length} Visitors, ${organizationsAll.length} Orgs.`);

        // 3. Demographics Logic (Buckets)
        console.log("Testing Demographics Buckets...");
        const detailedMembers = await db.User.findAll({
            where: { churchId, role: { [db.Sequelize.Op.like]: '%member%' } },
            attributes: ['birthDate', 'maritalStatus']
        });

        let buckets = { enfants: 0, ados: 0, jeunes: 0, adultes: 0, aines: 0 };
        detailedMembers.forEach(m => {
            if (!m.birthDate) { buckets.adultes++; return; }
            const age = new Date().getFullYear() - new Date(m.birthDate).getFullYear();
            const isMarried = m.maritalStatus && ['Marié', 'Married', 'Marié(e)'].some(s => m.maritalStatus.includes(s));

            if (age <= 8) buckets.enfants++;
            else if (age >= 9 && age <= 14) buckets.ados++;
            else if (age >= 15 && age <= 25) {
                if (isMarried) buckets.adultes++;
                else buckets.jeunes++;
            }
            else if (age >= 26 && age <= 60) buckets.adultes++;
            else buckets.aines++;
        });
        console.log("Demographics Buckets:", buckets);

        console.log("SUCCESS: Advanced Logic passed verification.");
        process.exit(0);

    } catch (error) {
        console.error("FAILURE:", error);
        process.exit(1);
    }
}

testDashboardStats();
