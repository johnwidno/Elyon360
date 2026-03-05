const db = require('./models');

async function check() {
    try {
        const user = await db.User.findOne({
            where: { email: 'john.widno@email.com' }, // Assuming this is the user based on previous logs or common pattern
            include: [{ model: db.Church, as: 'church' }]
        });

        if (!user) {
            const anyUser = await db.User.findOne({ include: [{ model: db.Church, as: 'church' }] });
            console.log("User not found by email. Checking first user in DB:");
            console.log(JSON.stringify(anyUser, null, 2));
            return;
        }

        console.log("USER DATA:");
        console.log("Email:", user.email);
        console.log("Roles (raw):", user.getDataValue('role'));
        console.log("Roles (parsed):", user.role);
        console.log("Church Name:", user.church?.name);
        console.log("Church Logo:", user.church?.logoUrl);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
