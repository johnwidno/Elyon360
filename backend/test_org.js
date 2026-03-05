const db = require('./models');

async function testOrg() {
    const t = await db.sequelize.transaction();
    try {
        const churchId = 17;
        const church = await db.Church.findByPk(churchId, { transaction: t });

        console.log("Creating Organization for Church", churchId);

        const org = await db.Organization.create({
            churchId,
            name: church.name,
            email: church.contactEmail,
            phone: church.contactPhone,
            isSystem: true,
            description: "Test"
        }, { transaction: t });

        await t.commit();
        console.log('SUCCESS: Organization created with ID', org.id);
    } catch (e) {
        if (t) await t.rollback();
        console.error('FAILED:');
        console.error(e);
        process.exit(1);
    }
}

testOrg();
