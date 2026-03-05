const db = require('./models');
const bcrypt = require('bcryptjs');

async function testFull() {
    // Enable logging
    db.sequelize.options.logging = console.log;

    const t = await db.sequelize.transaction();
    try {
        const pending = await db.PendingRegistration.findOne({
            order: [['createdAt', 'DESC']],
            transaction: t
        });

        const churchData = typeof pending.churchData === 'string' ? JSON.parse(pending.churchData) : pending.churchData;
        const adminData = typeof pending.adminData === 'string' ? JSON.parse(pending.adminData) : pending.adminData;

        console.log("--- STEP 1: CHURCH ---");
        const church = await db.Church.create({
            name: churchData.churchName, acronym: churchData.acronym, subdomain: churchData.subdomain,
            contactPhone: churchData.contactPhone, contactEmail: adminData.adminEmail,
            planId: pending.planId, status: 'active', moncashOrderId: pending.orderId,
            subscriptionStartedAt: new Date(), subscriptionExpiresAt: new Date()
        }, { transaction: t });

        console.log("--- STEP 2: CURRENCIES ---");
        await db.Currency.bulkCreate([
            { churchId: church.id, code: 'HTG', symbol: 'G' },
            { churchId: church.id, code: 'USD', symbol: '$' },
            { churchId: church.id, code: 'EUR', symbol: '€' }
        ], { transaction: t });

        console.log("--- STEP 3: ROLES ---");
        await db.Role.bulkCreate([
            { churchId: church.id, name: 'admin', permissions: ['all'] },
            { churchId: church.id, name: 'staff', permissions: ['read'] },
            { churchId: church.id, name: 'member', permissions: [] }
        ], { transaction: t });

        const hashedPassword = await bcrypt.hash(adminData.adminPassword, 10);
        await db.User.create({
            churchId: church.id, firstName: 'Admin', lastName: 'Principal',
            email: adminData.adminEmail, password: hashedPassword, role: 'admin'
        }, { transaction: t });

        await t.commit();
        console.log('SUCCESS');
    } catch (e) {
        if (t) await t.rollback();
        console.error('CRITICAL ERROR:');
        console.error(e);
        process.exit(1);
    }
}

testFull();
