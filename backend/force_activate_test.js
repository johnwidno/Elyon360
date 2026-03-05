const db = require('./models');
const saasOps = require('./controllers/saasController'); // This might not work if not exported, let's copy the logic

async function forceActivate() {
    try {
        const pending = await db.PendingRegistration.findOne({
            order: [['createdAt', 'DESC']]
        });

        if (!pending) {
            console.log('Aucune inscription trouvée.');
            return;
        }

        console.log(`Activation forcée pour: ${pending.orderId} (${pending.churchData.churchName})`);

        // We use the shared logic but we need access to it. 
        // Since it's a private function in the controller, I'll mock the call or re-implement.
        // Better: let's use the actual verification logic by mocking a request.

        const result = await activate(pending.orderId);
        console.log('Résultat:', result);
        process.exit(0);
    } catch (error) {
        console.error('ERREUR CRITIQUE:', error);
        process.exit(1);
    }
}

// Re-implementation of _handleSuccessfulPayment (simplified for test)
async function activate(orderId) {
    const t = await db.sequelize.transaction();
    try {
        const pending = await db.PendingRegistration.findOne({ where: { orderId }, transaction: t });
        if (!pending) throw new Error('Pending not found');

        let churchData = typeof pending.churchData === 'string' ? JSON.parse(pending.churchData) : pending.churchData;
        let adminData = typeof pending.adminData === 'string' ? JSON.parse(pending.adminData) : pending.adminData;

        // Check for bcrypt
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(adminData.adminPassword, 10);

        // CREATE CHURCH (Simplified logic from saasController)
        const church = await db.Church.create({
            name: churchData.churchName,
            subdomain: churchData.subdomain,
            acronym: churchData.acronym,
            contactPhone: churchData.contactPhone,
            contactEmail: adminData.adminEmail,
            planId: pending.planId,
            status: 'active',
            moncashOrderId: orderId
        }, { transaction: t });

        // CREATE ADMIN
        await db.User.create({
            churchId: church.id,
            firstName: 'Admin',
            lastName: 'Principal',
            email: adminData.adminEmail,
            password: hashedPassword,
            role: 'admin'
        }, { transaction: t });

        await t.commit();
        return { success: true, churchId: church.id };
    } catch (e) {
        await t.rollback();
        throw e;
    }
}

forceActivate();
