const db = require('./models');

async function checkSuperAdmin() {
    try {
        const user = await db.User.findOne({ where: { email: 'super@elyonsys.com' } });
        if (user) {
            console.log("Found User:", user.email);
            console.log("Role: '" + user.role + "'");
            console.log("ID:", user.id);
        } else {
            console.log("User super@elyonsys.com NOT FOUND");
        }

        // Also check if any user has role 'super_admin'
        const superAdmins = await db.User.findAll({ where: { role: 'super_admin' } });
        console.log("Count of users with role 'super_admin':", superAdmins.length);

    } catch (error) {
        console.error("Error:", error);
    }
}

checkSuperAdmin();
