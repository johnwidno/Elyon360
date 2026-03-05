const db = require('./models');
const bcrypt = require('bcryptjs');

async function testFullActivation() {
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

        console.log(`Test d'activation complète pour: ${pending.orderId}`);

        const { churchName, subdomain, acronym, contactPhone } = typeof pending.churchData === 'string' ? JSON.parse(pending.churchData) : pending.churchData;
        const { adminEmail, adminPassword } = typeof pending.adminData === 'string' ? JSON.parse(pending.adminData) : pending.adminData;
        const planId = pending.planId;
        const orderId = pending.orderId;

        // --- FULL LOGIC COPIED FROM saasController.js ---
        const selectedPlan = await db.Plan.findByPk(planId, { transaction: t });

        let expirationDate = new Date();
        const months = selectedPlan.durationMonths || (selectedPlan.interval === 'yearly' ? 12 : 1);
        expirationDate.setMonth(expirationDate.getMonth() + months);

        console.log("1. Creating Church...");
        const church = await db.Church.create({
            name: churchName, acronym, subdomain, contactPhone, contactEmail: adminEmail,
            planId, status: 'active', moncashOrderId: orderId,
            subscriptionStartedAt: new Date(), subscriptionExpiresAt: expirationDate
        }, { transaction: t });
        const churchId = church.id;

        console.log("2. Seeding Currencies...");
        await db.Currency.bulkCreate([
            { churchId, code: 'HTG', symbol: 'G' },
            { churchId, code: 'USD', symbol: '$' },
            { churchId, code: 'EUR', symbol: '€' }
        ], { transaction: t });

        console.log("3. Seeding DonationTypes...");
        await db.DonationType.bulkCreate([
            { churchId, name: 'OFFRANDE', isMandatory: true },
            { churchId, name: 'DIME', isMandatory: true },
            { churchId, name: 'PROMESSE', isMandatory: true },
            { churchId, name: 'DON_SPECIAL', isMandatory: true }
        ], { transaction: t });

        console.log("4. Seeding PaymentMethods...");
        await db.PaymentMethod.bulkCreate([
            { churchId, name: 'CASH' },
            { churchId, name: 'VIREMENT' },
            { churchId, name: 'CHEQUE' },
            { churchId, name: 'CARTE DE CREDIT' }
        ], { transaction: t });

        console.log("5. Seeding Roles...");
        await db.Role.bulkCreate([
            { churchId, name: 'admin', permissions: ['members', 'events', 'groups', 'finances', 'sunday-school', 'inventory', 'ceremonies', 'settings'] },
            { churchId, name: 'staff', permissions: ['members', 'events', 'groups', 'sunday-school', 'ceremonies'] },
            { churchId, name: 'member', permissions: [] }
        ], { transaction: t });

        console.log("6. Seeding ContactTypes & Subtypes...");
        const typeMember = await db.ContactType.create({ churchId, name: 'Membre', isSystem: true }, { transaction: t });
        const typeOrg = await db.ContactType.create({ churchId, name: 'Organisation', isSystem: true }, { transaction: t });

        await db.ContactSubtype.bulkCreate(['Baptisé', 'Adhérent', 'Affilié', 'Candidat au baptême', 'Autre'].map(s => ({
            churchId, contactTypeId: typeMember.id, name: s
        })), { transaction: t });

        await db.ContactSubtype.bulkCreate(['Ong', 'Eglise', 'Eglise partenaire', 'Fournisseur', 'Université', 'Ecole', 'Hôpital', 'Autre'].map(s => ({
            churchId, contactTypeId: typeOrg.id, name: s
        })), { transaction: t });

        console.log("7. Seeding MemberCategories...");
        await db.MemberCategory.bulkCreate(['Baptisé', 'Non baptisé', 'Adhérent', 'Candidat au baptême', 'Affilié', 'Enfant', 'Transféré', 'Autre'].map(name => ({
            churchId, name
        })), { transaction: t });

        console.log("8. Seeding EventTypes...");
        await db.EventType.bulkCreate(['Service', 'Culte', 'Conférence', 'Formation', 'Étude', 'Service de prière', 'Service de jeune', 'Retraite spirituelle', 'Activité sociale', 'Visite', 'Excursion', 'Autre'].map(name => ({
            churchId, name
        })), { transaction: t });

        console.log("9. Creating Organization...");
        const egliseSubtype = await db.ContactSubtype.findOne({ where: { churchId, name: 'Eglise' }, transaction: t });
        await db.Organization.create({
            churchId, name: church.name, email: church.contactEmail, phone: church.contactPhone,
            subtypeId: egliseSubtype ? egliseSubtype.id : null, isSystem: true, description: "Votre organisation (Auto-générée)"
        }, { transaction: t });

        console.log("10. Creating Admin User...");
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await db.User.create({
            churchId: church.id, firstName: 'Admin', lastName: 'Principal',
            email: adminEmail, password: hashedPassword, role: 'admin'
        }, { transaction: t });

        await t.commit();
        console.log('SUCCESS: Full activation completed for Church ID', churchId);
    } catch (error) {
        if (t) await t.rollback();
        console.error('FAILED AT STEP:', error);
        process.exit(1);
    }
}

testFullActivation();
