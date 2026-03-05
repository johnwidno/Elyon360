const db = require('./models');
const bcrypt = require('bcryptjs');

// Copy of the logic from saasController.js
const _createChurchFull = async (data, t) => {
    const { churchName, subdomain, adminEmail, adminPassword, planId, acronym, contactPhone, orderId, status = 'active' } = data;
    const selectedPlan = await db.Plan.findByPk(planId, { transaction: t });
    let subscriptionStartedAt = new Date();
    let expirationDate = new Date();
    const months = selectedPlan.durationMonths || (selectedPlan.interval === 'yearly' ? 12 : 1);
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

    const typeMember = await db.ContactType.create({ churchId, name: 'Membre', isSystem: true }, { transaction: t });
    const typeOrg = await db.ContactType.create({ churchId, name: 'Organisation', isSystem: true }, { transaction: t });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await db.User.create({
        churchId, firstName: 'Admin', lastName: 'Principal',
        email: adminEmail, password: hashedPassword, role: 'admin'
    }, { transaction: t });

    return church;
};

async function forceActivateLatest() {
    const t = await db.sequelize.transaction();
    try {
        const pending = await db.PendingRegistration.findOne({ order: [['id', 'DESC']], transaction: t });
        if (!pending) { console.log('None'); await t.rollback(); return; }

        console.log('Activating:', pending.orderId);
        let churchData = typeof pending.churchData === 'string' ? JSON.parse(pending.churchData) : pending.churchData;
        let adminData = typeof pending.adminData === 'string' ? JSON.parse(pending.adminData) : pending.adminData;

        const church = await _createChurchFull({
            ...churchData, ...adminData, planId: pending.planId, orderId: pending.orderId, status: 'active'
        }, t);

        await db.SubscriptionTransaction.create({
            churchId: church.id, planId: pending.planId, amount: pending.amount, currency: 'HTG',
            paymentMethod: pending.paymentMethod, orderId: pending.orderId, status: 'success'
        }, { transaction: t });

        await pending.destroy({ transaction: t });
        await t.commit();
        console.log('SUCCESS');
    } catch (e) {
        if (t) await t.rollback();
        console.error(e);
        process.exit(1);
    }
}

forceActivateLatest();
