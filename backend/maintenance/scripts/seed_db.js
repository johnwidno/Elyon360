const db = require('../../models');
const bcrypt = require('bcryptjs');

async function seedDB() {
    try {
        console.log("⚡ Starting Seeding Process...");

        // 1. Seed Subscription Plans
        console.log("Seeding Plans...");
        const plans = [
            { name: 'Gratuit', price: 0, interval: 'monthly', features: ["Gestion des membres", "Gestion des dons"] },
            { name: 'Standard (Mensuel)', price: 25, interval: 'monthly', features: ["Tout du gratuit", "Budgets & Dépenses", "Gestion des Groupes"] },
            { name: 'Standard (Annuel)', price: 250, interval: 'yearly', features: ["Tout du gratuit", "Budgets & Dépenses", "Gestion des Groupes", "Economie 2 mois"] },
            { name: 'Premium (Mensuel)', price: 50, interval: 'monthly', features: ["Tout du standard", "Inventaire", "Ecole du Dimanche", "Cérémonies"] },
            { name: 'Premium (Annuel)', price: 500, interval: 'yearly', features: ["Tout du standard", "Inventaire", "Ecole du Dimanche", "Cérémonies", "Economie 2 mois"] }
        ];

        for (const planData of plans) {
            await db.Plan.findOrCreate({
                where: { name: planData.name },
                defaults: planData
            });
        }
        console.log("✅ Plans seeded.");

        // 2. Create System Church for Super Admin
        console.log("Creating System Church...");
        let adminChurch = await db.Church.findOne({ where: { subdomain: 'admin-system' } });
        if (!adminChurch) {
            adminChurch = await db.Church.create({
                name: "ElyonSys Admin System",
                subdomain: "admin-system",
                acronym: "SYS",
                contactEmail: "admin@elyonsys.com",
                status: 'active'
            });
            console.log("✅ System Church created.");
        } else {
            // Force reset values to prevent hijacking
            await adminChurch.update({
                name: "ElyonSys Admin System",
                subdomain: "admin-system",
                acronym: "SYS",
                status: 'active'
            });
            console.log("✅ System Church recovered/updated.");
        }

        const churchId = adminChurch.id;

        // 3. Seed Default Contact Classification for System Church
        const typeMember = await db.ContactType.findOrCreate({
            where: { churchId, name: 'Membre' },
            defaults: { isSystem: true }
        });
        const typeOrg = await db.ContactType.findOrCreate({
            where: { churchId, name: 'Organisation' },
            defaults: { isSystem: true }
        });

        const memberSubtypes = ['Baptisé', 'Fidèle', 'Enfant', 'Visiteur régulier', 'Postulant', 'Ancien'];
        for (const s of memberSubtypes) {
            await db.ContactSubtype.findOrCreate({
                where: { churchId, contactTypeId: typeMember[0].id, name: s }
            });
        }

        const subtypes = ['Ong', 'Eglise', 'Eglise partenaire', 'Fournisseur', 'Université', 'Ecole', 'Hôpital', 'Autre'];
        for (const s of subtypes) {
            await db.ContactSubtype.findOrCreate({
                where: { churchId, contactTypeId: typeOrg[0].id, name: s }
            });
        }

        const egliseSubtype = await db.ContactSubtype.findOne({
            where: { churchId, name: 'Eglise' }
        });

        // 4. Create the self-representing Organization for System Church
        await db.Organization.findOrCreate({
            where: { churchId, isSystem: true },
            defaults: {
                name: adminChurch.name,
                email: adminChurch.contactEmail,
                subtypeId: egliseSubtype ? egliseSubtype.id : null,
                isSystem: true,
                description: "Votre organisation système (Auto-générée)"
            }
        });
        console.log("✅ System Church classification and Org record seeded.");

        // 5. Create Super Admin User
        const email = "super@elyonsys.com";
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 10);

        const [user, created] = await db.User.findOrCreate({
            where: { email },
            defaults: {
                firstName: "Super",
                lastName: "Admin",
                password: hashedPassword,
                churchId: adminChurch.id,
                role: "super_admin"
            }
        });

        if (created) {
            console.log("✅ Super Admin user created.");
        } else {
            console.log("ℹ️ Super Admin user already exists.");
        }

        console.log("\n=================================");
        console.log("Login Credentials:");
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log("=================================\n");

        console.log("Seeding completed successfully.");
    } catch (error) {
        console.error("❌ Seeding Error:", error);
        throw error;
    }
}

// Allow being required by reset_db.js
if (require.main === module) {
    seedDB().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedDB;
