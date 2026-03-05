const db = require('./models');

const CHURCH_NAMES = [
    "Eglise de la Grace", "Ministere de la Foi", "Tabernacle de Louange",
    "Mission Evangelique", "Eglise du Rocher", "Temple de Verite",
    "Assemblee de Dieu", "Bethanie Ministere", "Sion Eglise", "Ebenezer Mission",
    "Source de Vie", "Vraie Parole", "Lumiere du Monde", "Berger d'Israel",
    "La Voix du Salut", "Porte de l'Eternel", "Le Grand Roi", "Choeur Celeste",
    "Cercle de Priere", "Tabernacle du Temoignage"
];

const FIRST_NAMES = ["Adam", "Bernice", "Charles", "Dorothy", "Enoch", "Florence", "Gabriel", "Hannah", "Isaac", "Judith", "Karl", "莉亚", "Mark", "Naomi", "Oswald", "Phoebe", "Quincy", "Ruth", "Samuel", "Tabitha"];
const LAST_NAMES = ["Smith", "Jean", "Pierre", "Louis", "Joseph", "Noel", "Charles", "Auguste", "Baptiste", "Cenat", "Dorsainvil", "Etienne", "Francois", "Guerrier", "Hyppolite", "Isme", "Jacques", "Lundy", "Michel", "Narcisse"];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedRealData = async () => {
    try {
        console.log("Starting to seed realistic historical data...");

        // 1. Get existing plans
        const plans = await db.Plan.findAll();
        if (plans.length === 0) {
            console.log("No plans found. Please seed plans first.");
            return;
        }

        const now = new Date();

        for (let i = 0; i < 25; i++) {
            // Generate a random date in the last 12 months
            const monthsAgo = Math.floor(Math.random() * 12);
            const daysAgo = Math.floor(Math.random() * 28);
            const createdAt = new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate() - daysAgo);

            const baseName = getRandom(CHURCH_NAMES) + " " + (i + 1);
            const acronym = baseName.split(' ').map(w => w[0]).join('').toUpperCase();
            const subdomain = baseName.toLowerCase().replace(/ /g, '-') + "-" + Math.floor(Math.random() * 1000);

            const plan = getRandom(plans);

            // Create Church
            const church = await db.Church.create({
                name: baseName,
                acronym,
                subdomain,
                planId: plan.id,
                status: 'active',
                createdAt,
                updatedAt: createdAt,
                subscriptionStartedAt: createdAt,
                subscriptionExpiresAt: new Date(createdAt.getFullYear(), createdAt.getMonth() + 1, createdAt.getDate())
            });

            // Create Admin User
            await db.User.create({
                firstName: getRandom(FIRST_NAMES),
                lastName: getRandom(LAST_NAMES),
                email: `admin.${subdomain}@example.com`,
                password: 'password123', // Doesn't matter for mock
                role: 'admin',
                churchId: church.id,
                createdAt,
                updatedAt: createdAt
            });

            // Create 2-10 random members for each church
            const memberCount = Math.floor(Math.random() * 15) + 5;
            for (let j = 0; j < memberCount; j++) {
                const memberDate = new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime()));
                await db.User.create({
                    firstName: getRandom(FIRST_NAMES),
                    lastName: getRandom(LAST_NAMES),
                    email: `user${j}.${subdomain}@example.com`,
                    password: 'password123',
                    role: 'member',
                    churchId: church.id,
                    createdAt: memberDate,
                    updatedAt: memberDate
                });
            }

            // Create Transaction if it's a paid plan
            if (plan.price > 0) {
                await db.SubscriptionTransaction.create({
                    churchId: church.id,
                    planId: plan.id,
                    amount: plan.price,
                    currency: 'HTG',
                    paymentMethod: 'moncash',
                    orderId: `ORD-${Date.now()}-${i}`,
                    status: 'success',
                    periodStart: createdAt,
                    periodEnd: new Date(createdAt.getFullYear(), createdAt.getMonth() + 1, createdAt.getDate()),
                    createdAt,
                    updatedAt: createdAt
                });
            }
        }

        console.log("Successfully seeded 25 churches with members and transactions.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
};

seedRealData();
