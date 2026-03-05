const db = require('./models');
const bcrypt = require('bcryptjs');

async function seedTestChurches() {
    try {
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 10);

        const plan = await db.Plan.findOne({ where: { name: 'Standard (Mensuel)' } }) || { id: 1 };

        const testChurches = [
            {
                name: "Église Baptiste de Canse",
                subdomain: "eglisebaptistecanse",
                acronym: "EBC",
                contactEmail: "admin@canse.com"
            },
            {
                name: "Église Baptiste de Ducis",
                subdomain: "eglisebaptistededucis",
                acronym: "EBD",
                contactEmail: "admin@ducis.com"
            }
        ];

        for (const data of testChurches) {
            console.log(`Creating church: ${data.name}...`);
            const [church, created] = await db.Church.findOrCreate({
                where: { subdomain: data.subdomain },
                defaults: {
                    ...data,
                    planId: plan.id,
                    status: 'active'
                }
            });

            if (created) {
                const churchId = church.id;

                // Create Default Admin for the church
                await db.User.findOrCreate({
                    where: { email: data.contactEmail },
                    defaults: {
                        firstName: "Admin",
                        lastName: data.acronym,
                        email: data.contactEmail,
                        password: hashedPassword,
                        churchId: churchId,
                        role: "admin"
                    }
                });

                // Seed Roles for this church
                await db.Role.bulkCreate([
                    { churchId, name: 'admin', permissions: ['members', 'events', 'groups', 'finances', 'sunday-school', 'inventory', 'ceremonies', 'settings'] },
                    { churchId, name: 'staff', permissions: ['members', 'events', 'groups', 'sunday-school', 'ceremonies'] },
                    { churchId, name: 'member', permissions: [] }
                ]);

                // Seed Event Types
                const defaultEventTypes = ['Service', 'Culte', 'Conférence', 'Formation', 'Étude', 'Autre'];
                await db.EventType.bulkCreate(defaultEventTypes.map(name => ({ churchId, name })));

                console.log(`✅ Church ${data.subdomain} created successfully.`);
            } else {
                console.log(`ℹ️ Church ${data.subdomain} already exists.`);
            }
        }

        console.log("\n=================================");
        console.log("Comptes de test créés :");
        console.log("1. Email: admin@canse.com / Password: password123");
        console.log("2. Email: admin@ducis.com / Password: password123");
        console.log("=================================\n");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Error:", error);
        process.exit(1);
    }
}

seedTestChurches();
