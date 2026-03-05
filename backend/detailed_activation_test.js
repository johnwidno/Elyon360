const db = require('./models');
const bcrypt = require('bcryptjs');

async function forceActivate() {
    const t = await db.sequelize.transaction();
    try {
        const pending = await db.PendingRegistration.findOne({
            order: [['createdAt', 'DESC']],
            transaction: t
        });

        if (!pending) {
            console.log('Aucune inscription trouvée.');
            await t.rollback();
            return;
        }

        console.log(`Tentative d'activation pour: ${pending.orderId}`);

        const { churchName, subdomain, acronym, contactPhone } = typeof pending.churchData === 'string' ? JSON.parse(pending.churchData) : pending.churchData;
        const { adminEmail, adminPassword } = typeof pending.adminData === 'string' ? JSON.parse(pending.adminData) : pending.adminData;
        const planId = pending.planId;
        const orderId = pending.orderId;

        // COPIED FROM saasController.js _createChurchFull
        const selectedPlan = await db.Plan.findByPk(planId, { transaction: t });
        if (!selectedPlan) throw new Error('Plan not found: ' + planId);

        let expirationDate = new Date();
        const months = selectedPlan.durationMonths || (selectedPlan.interval === 'yearly' ? 12 : 1);
        expirationDate.setMonth(expirationDate.getMonth() + months);

        const church = await db.Church.create({
            name: churchName, acronym, subdomain, contactPhone, contactEmail: adminEmail,
            planId, status: 'active', moncashOrderId: orderId,
            subscriptionStartedAt: new Date(), subscriptionExpiresAt: expirationDate
        }, { transaction: t });

        const churchId = church.id;

        // SEED DATA
        await db.Currency.bulkCreate([
            { churchId, code: 'HTG', symbol: 'G' },
            { churchId, code: 'USD', symbol: '$' }
        ], { transaction: t });

        await db.Role.bulkCreate([
            { churchId, name: 'admin', permissions: ['members', 'events', 'groups', 'finances', 'settings'] },
            { churchId, name: 'staff', permissions: ['members', 'events', 'groups'] },
            { churchId, name: 'member', permissions: [] }
        ], { transaction: t });

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await db.User.create({
            churchId, firstName: 'Admin', lastName: 'Principal',
            email: adminEmail, password: hashedPassword, role: 'admin'
        }, { transaction: t });

        await t.commit();
        console.log('SUCCESS: Church created with ID', churchId);
    } catch (error) {
        if (t) await t.rollback();
        console.error('FAILED TO ACTIVATE:');
        console.error(error);
        process.exit(1);
    }
}

forceActivate();
