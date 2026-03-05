const db = require('./models');

const seedSeptemberData = async () => {
    try {
        console.log("Seeding specific data for September 2025...");

        const churches = await db.Church.findAll();
        if (churches.length === 0) {
            console.log("No churches found.");
            return;
        }

        // Target: September 2025
        // We'll pick random days in Sept
        const year = 2025;
        const month = 8; // September (0-indexed)

        const FIRST_NAMES = ["Jean", "Marie", "Pierre", "Luc", "Paul", "Anne", "Julie", "Sara", "Marc", "Jacques"];
        const LAST_NAMES = ["Dumas", "Lefebvre", "Moreau", "Laurent", "Simon", "Michel", "Garcia", "David", "Bertrand", "Roux"];

        // 1. Add 60 Users distributed across churches in Sept 2025
        for (let i = 0; i < 60; i++) {
            const day = Math.floor(Math.random() * 28) + 1;
            const createdAt = new Date(year, month, day, 10, 0, 0);
            const church = churches[i % churches.length];

            await db.User.create({
                firstName: FIRST_NAMES[i % FIRST_NAMES.length],
                lastName: LAST_NAMES[i % LAST_NAMES.length],
                email: `sept.user${i}@example.com`,
                password: 'password123',
                role: 'member',
                churchId: church.id,
                createdAt,
                updatedAt: createdAt
            });
        }

        // 2. Add 5 new Churches in Sept 2025 to show enrollment growth
        for (let i = 0; i < 5; i++) {
            const day = Math.floor(Math.random() * 28) + 1;
            const createdAt = new Date(year, month, day, 11, 0, 0);
            const name = `Eglise de Septembre ${i + 1}`;

            const church = await db.Church.create({
                name,
                acronym: `ES${i + 1}`,
                subdomain: `sept-church-${i + 1}-${Math.floor(Math.random() * 1000)}`,
                status: 'active',
                createdAt,
                updatedAt: createdAt
            });

            // Create admin for it
            await db.User.create({
                firstName: "Admin",
                lastName: "Sept",
                email: `admin.sept${i}@example.com`,
                password: 'password123',
                role: 'admin',
                churchId: church.id,
                createdAt,
                updatedAt: createdAt
            });
        }

        console.log("Successfully injected 60 users and 5 churches into September 2025.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding September data:", error);
        process.exit(1);
    }
};

seedSeptemberData();
