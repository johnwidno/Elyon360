const db = require('./models');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
    try {
        console.log("⚡ Creating Super Admin...");

        // 1. Ensure System Church exists
        let adminChurch = await db.Church.findOne({ where: { subdomain: 'admin-system' } });

        if (!adminChurch) {
            console.log("Creating System Church...");
            adminChurch = await db.Church.create({
                name: "ElyonSys Admin System",
                subdomain: "admin-system",
                acronym: "SYS",
                contactEmail: "admin@elyonsys.com"
            });

            // Seed defaults for this church so it doesn't crash on relations
            await db.Role.create({ churchId: adminChurch.id, name: 'super_admin', permissions: ['all'] });
        }

        // 2. Create Super Admin User
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
                role: "super_admin" // This matches the check in useAuth/backend
            }
        });

        if (created) {
            console.log("\n✅ Super Admin Created Successfully!");
        } else {
            console.log("\nℹ️ Super Admin already exists.");
            // Optional: Update password if needed
            user.password = hashedPassword;
            user.role = "super_admin";
            await user.save();
            console.log("✅ Password reset to default.");
        }

        console.log("\n=================================");
        console.log("Login Credentials:");
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log("=================================\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

createSuperAdmin();
