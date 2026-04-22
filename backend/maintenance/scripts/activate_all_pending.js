const db = require('./models');
const bcrypt = require('bcryptjs');

const _createChurchFull = async (data, t) => {
    const { churchName, subdomain, adminEmail, adminPassword, planId, acronym, contactPhone, orderId, status = 'active' } = data;
    const selectedPlan = await db.Plan.findByPk(planId, { transaction: t });
    let subscriptionStartedAt = new Date();
    let expirationDate = new Date();
    const months = selectedPlan ? (selectedPlan.durationMonths || (selectedPlan.interval === 'yearly' ? 12 : 1)) : 1;
    expirationDate.setMonth(expirationDate.getMonth() + months);

    const church = await db.Church.create({
        name: churchName, acronym, subdomain, contactPhone, contactEmail: adminEmail,
        planId, status, moncashOrderId: orderId,
        subscriptionStartedAt: status === 'active' ? subscriptionStartedAt : null,
        subscriptionExpiresAt: status === 'active' ? expirationDate : null
    }, { transaction: t });

    const churchId = church.id;
    await db.Currency.bulkCreate([{ churchId, code: 'HTG', symbol: 'G' }, { churchId, code: 'USD', symbol: '$' }], { transaction: t });
    await db.Role.bulkCreate([
        { churchId, name: 'admin', permissions: ['all'] },
        { churchId, name: 'staff', permissions: ['none'] },
        { churchId, name: 'member', permissions: [] }
    ], { transaction: t });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await db.User.create({
        churchId, firstName: 'Admin', lastName: 'Principal',
        email: adminEmail, password: hashedPassword, role: 'admin'
    }, { transaction: t });

    return church;
};

async function activateAll() {
    const pendings = await db.PendingRegistration.findAll();
    console.log(`Found ${pendings.length} pending registrations.`);

    for (const pending of pendings) {
        const t = await db.sequelize.transaction();
        try {
            console.log(`Processing Order: ${pending.orderId}...`);

            // Check if already exists
            const existing = await db.Church.findOne({ where: { moncashOrderId: pending.orderId }, transaction: t });
            if (existing) {
                console.log(`  - Already activated as Church ID: ${existing.id}`);
                await pending.destroy({ transaction: t });
                await t.commit();
                continue;
            }

            let churchData = typeof pending.churchData === 'string' ? JSON.parse(pending.churchData) : pending.churchData;
            let adminData = typeof pending.adminData === 'string' ? JSON.parse(pending.adminData) : pending.adminData;

            // Check if subdomain or email already taken in active churches
            const subTaken = await db.Church.findOne({ where: { subdomain: churchData.subdomain }, transaction: t });
            const emailTaken = await db.User.findOne({ where: { email: adminData.adminEmail }, transaction: t });

            if (subTaken || emailTaken) {
                console.log(`  - SKIPPED: ${subTaken ? 'Subdomain' : 'Email'} already taken.`);
                await t.rollback();
                continue;
            }

            const church = await _createChurchFull({
                ...churchData, ...adminData, planId: pending.planId, orderId: pending.orderId, status: 'active'
            }, t);

            await db.SubscriptionTransaction.create({
                churchId: church.id, planId: pending.planId, amount: pending.amount, currency: 'HTG',
                paymentMethod: pending.paymentMethod, orderId: pending.orderId, status: 'success'
            }, { transaction: t });

            await pending.destroy({ transaction: t });
            await t.commit();
            console.log(`  - SUCCESS: Church ID ${church.id} created.`);
        } catch (e) {
            if (t) await t.rollback();
            console.error(`  - FAILED for Order ${pending.orderId}:`, e.message);
        }
    }
    process.exit(0);
}

activateAll();
