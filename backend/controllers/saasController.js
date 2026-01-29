const db = require('../models');
const bcrypt = require('bcryptjs');

// Get Church Public Info
exports.getChurchPublicInfo = async (req, res) => {
    try {
        const subdomain = req.params.subdomain?.trim();
        console.log(`[Controller] Fetching Public Info for identifier: "${subdomain}"`);

        const church = await db.Church.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { subdomain: subdomain },
                    { customDomain: subdomain },
                    { acronym: subdomain.toUpperCase() },
                    { acronym: subdomain.toLowerCase() }
                ]
            }
        });

        if (!church) {
            console.warn(`[Controller] No church found for identifier: "${subdomain}"`);
            // Check all churches to see if there's a sneaky mismatch
            const all = await db.Church.findAll({ attributes: ['id', 'subdomain', 'acronym'] });
            console.log("[Controller] Available churches in DB:", JSON.stringify(all));

            return res.status(404).json({ message: `[Controller] Église non trouvée pour : ${subdomain}` });
        }

        console.log(`[Controller] Church found: "${church.name}" (ID: ${church.id})`);

        // Fetch public events for this church
        const events = await db.Event.findAll({
            where: { churchId: church.id },
            order: [['startDate', 'ASC']],
            limit: 5
        });

        res.json({ church, events });
    } catch (error) {
        console.error("Public Info error:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.registerChurch = async (req, res) => {
    try {
        const { churchName, subdomain, adminEmail, adminPassword, plan, acronym, contactPhone } = req.body;

        // 1. Check if subdomain or acronym exists
        const existing = await db.Church.findOne({
            where: {
                [db.Sequelize.Op.or]: [
                    { subdomain: subdomain },
                    { acronym: acronym }
                ]
            }
        });
        if (existing) {
            return res.status(400).json({ message: "Ce sous-domaine ou acronyme est déjà utilisé." });
        }

        // Prevent use of restricted subdomains
        const restricted = ['admin-system', 'www', 'app', 'elyonsys'];
        if (restricted.includes(subdomain.toLowerCase())) {
            return res.status(400).json({ message: "Ce sous-domaine est réservé par le système." });
        }

        // 2. Create Church with Plan association
        let planId = plan;
        const selectedPlan = await db.Plan.findByPk(planId);

        let expirationDate = new Date();
        if (selectedPlan) {
            if (selectedPlan.interval === 'monthly') {
                expirationDate.setMonth(expirationDate.getMonth() + 1);
            } else if (selectedPlan.interval === 'yearly') {
                expirationDate.setFullYear(expirationDate.getFullYear() + 1);
            }
        } else {
            // Default check if plan id is missing or invalid
            expirationDate.setMonth(expirationDate.getMonth() + 1);
        }

        const church = await db.Church.create({
            name: churchName,
            acronym: acronym,
            subdomain: subdomain,
            contactPhone: contactPhone,
            contactEmail: adminEmail,
            planId: planId,
            subscriptionStartedAt: new Date(),
            subscriptionExpiresAt: expirationDate
        });

        // 3. Seed Default Data (Currencies, DonationTypes, PaymentMethods, Roles)
        const churchId = church.id;

        // Default Currencies
        await db.Currency.bulkCreate([
            { churchId, code: 'HTG', symbol: 'G' },
            { churchId, code: 'USD', symbol: '$' },
            { churchId, code: 'EUR', symbol: '€' }
        ]);

        // Default Donation Types
        await db.DonationType.bulkCreate([
            { churchId, name: 'OFFRANDE', isMandatory: true },
            { churchId, name: 'DIME', isMandatory: true },
            { churchId, name: 'PROMESSE', isMandatory: true },
            { churchId, name: 'DON_SPECIAL', isMandatory: true }
        ]);

        // Default Payment Methods
        await db.PaymentMethod.bulkCreate([
            { churchId, name: 'CASH' },
            { churchId, name: 'VIREMENT' },
            { churchId, name: 'CHEQUE' },
            { churchId, name: 'CARTE DE CREDIT' }
        ]);

        // Default Roles (lowercase to match roleController self-healing)
        await db.Role.bulkCreate([
            { churchId, name: 'admin', permissions: ['members', 'events', 'groups', 'finances', 'sunday-school', 'inventory', 'ceremonies', 'settings'] },
            { churchId, name: 'staff', permissions: ['members', 'events', 'groups', 'sunday-school', 'ceremonies'] },
            { churchId, name: 'member', permissions: [] }
        ]);

        // Default Contact Classification
        const typeMember = await db.ContactType.create({ churchId, name: 'Membre', isSystem: true });
        const typeOrg = await db.ContactType.create({ churchId, name: 'Organisation', isSystem: true });

        const memberSubtypes = [
            'Baptisé', 'Adhérent', 'Affilié', 'Candidat au baptême', 'Autre'
        ];
        await db.ContactSubtype.bulkCreate(memberSubtypes.map(s => ({
            churchId,
            contactTypeId: typeMember.id,
            name: s
        })));

        const subtypes = [
            'Ong', 'Eglise', 'Eglise partenaire', 'Fournisseur', 'Université', 'Ecole', 'Hôpital', 'Autre'
        ];
        await db.ContactSubtype.bulkCreate(subtypes.map(s => ({
            churchId,
            contactTypeId: typeOrg.id,
            name: s
        })));

        // Default Event Types
        const defaultEventTypes = [
            'Service', 'Culte', 'Conférence', 'Formation', 'Étude',
            'Service de prière', 'Service de jeune', 'Retraite spirituelle',
            'Activité sociale', 'Visite', 'Excursion', 'Autre'
        ];
        await db.EventType.bulkCreate(defaultEventTypes.map(t => ({
            churchId,
            name: t
        })));

        // Create the self-representing Organization
        const egliseSubtype = await db.ContactSubtype.findOne({
            where: { churchId, name: 'Eglise' }
        });

        await db.Organization.create({
            churchId,
            name: church.name,
            email: church.contactEmail,
            phone: church.contactPhone,
            address: church.address,
            subtypeId: egliseSubtype ? egliseSubtype.id : null,
            isSystem: true,
            description: "Votre organisation (Auto-générée)"
        });

        // 3. Create Admin User linked to this church
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        console.log("Creating Admin User for email:", adminEmail);

        const newUser = await db.User.create({
            churchId: church.id,
            firstName: 'Admin',
            lastName: 'Principal',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
        });

        console.log("Admin User created successfully:", newUser.email);

        // 4. Notify Super Admin(s)
        // 4. Notify Super Admin(s)
        const superAdmins = await db.User.findAll({
            where: {
                role: { [db.Sequelize.Op.like]: '%"super_admin"%' }
            }
        });
        if (superAdmins.length > 0) {
            const notifications = superAdmins.map(admin => ({
                userId: admin.id,
                title: 'Nouvelle Inscription',
                message: `Une nouvelle église "${church.name}" (${church.acronym}) s'est inscrite.`,
                type: 'system',
                isRead: false
            }));
            await db.Notification.bulkCreate(notifications);
        }

        res.status(201).json({
            message: "Église et Admin créés avec succès",
            church: {
                id: church.id,
                name: church.name,
                subdomain: church.subdomain
            }
        });

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ message: "Erreur lors de la création de l'église." });
    }
};

exports.getGlobalStats = async (req, res) => {
    try {
        const [churchCount, userCount, donationTotal] = await Promise.all([
            db.Church.count(),
            db.User.count(),
            db.Donation.sum('amount')
        ]);

        res.json({
            churchCount,
            userCount,
            donationTotal: donationTotal || 0
        });
    } catch (error) {
        console.error("Global Stats Error:", error);
        res.status(500).json({ message: "Erreur lors du calcul des statistiques globales." });
    }
};
