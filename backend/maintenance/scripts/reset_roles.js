const db = require('./models');

async function resetRoles() {
    try {
        console.log('Connecting to database...');
        // Force simple sync first to ensure tables exist
        // await db.sequelize.sync({ alter: false });

        console.log('Deleting all existing roles...');
        await db.Role.destroy({
            where: {},
            truncate: true
        });

        console.log('Roles table truncated.');

        // Defaults to seed
        const defaults = [
            { name: 'admin', permissions: ['members', 'events', 'groups', 'finances', 'sunday-school', 'inventory', 'ceremonies', 'settings'] },
            { name: 'staff', permissions: ['members', 'events', 'groups', 'sunday-school', 'ceremonies'] },
            { name: 'member', permissions: [] }
        ];

        // We need to associate these with a church. 
        // For now, let's look for the first church or just seed for Church ID 1 (Tenant 1).
        // Or better: seed for ALL existing churches?
        // The user's request implies a general reset.

        const churches = await db.Church.findAll();
        if (churches.length === 0) {
            console.log("No churches found. Creating defaults for ID 1 just in case.");
            // Create for ID 1 even if church doesn't exist? Role has FK? 
            // Usually Role belongsTo Church.
            // If strict, we can't.
            // Let's assume at least one church exists.
        }

        for (const church of churches) {
            console.log(`Seeding roles for Church: ${church.name} (ID: ${church.id})`);
            for (const def of defaults) {
                await db.Role.create({
                    churchId: church.id,
                    name: def.name,
                    permissions: def.permissions
                });
            }
        }

        console.log('Roles reset successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting roles:', error);
        process.exit(1);
    }
}

resetRoles();
