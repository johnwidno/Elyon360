const db = require('../models');

// Get all roles for current church
exports.getRoles = async (req, res) => {
    try {
        const churchId = req.user?.churchId || req.church?.id;
        let roles = await db.Role.findAll({ where: { churchId } });

        // Self-healing: Ensure default roles exist
        // Self-healing: Ensure default roles exist
        const defaults = [
            { name: 'admin', permissions: ['members', 'events', 'groups', 'finances', 'sunday-school', 'inventory', 'ceremonies', 'settings'] },
            { name: 'staff', permissions: ['members', 'events', 'groups', 'sunday-school', 'ceremonies'] },
            { name: 'member', permissions: [] }
        ];

        let added = false;
        for (const def of defaults) {
            if (!roles.find(r => r.name === def.name)) {
                console.log(`Seeding missing default role: ${def.name}`);
                await db.Role.create({
                    churchId,
                    name: def.name,
                    permissions: def.permissions
                });
                added = true;
            }
        }

        if (added) {
            roles = await db.Role.findAll({ where: { churchId } });
        }

        res.json(roles);
    } catch (error) {
        console.error("Get Roles Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des rôles." });
    }
};

// Create a new role
exports.createRole = async (req, res) => {
    try {
        const churchId = req.user?.churchId || req.church?.id;
        const { name, permissions } = req.body;

        if (!name) return res.status(400).json({ message: "Le nom du rôle est requis." });

        const role = await db.Role.create({
            churchId,
            name,
            permissions: permissions || []
        });

        res.status(201).json(role);
    } catch (error) {
        console.error("Create Role Error:", error);
        res.status(500).json({ message: "Erreur lors de la création du rôle." });
    }
};

// Update a role
exports.updateRole = async (req, res) => {
    try {
        const churchId = req.user?.churchId || req.church?.id;
        const { id } = req.params;
        const { name, permissions } = req.body;

        const role = await db.Role.findOne({ where: { id, churchId } });
        if (!role) return res.status(404).json({ message: "Rôle non trouvé." });

        await role.update({
            name: name || role.name,
            permissions: permissions !== undefined ? permissions : role.permissions
        });

        res.json(role);
    } catch (error) {
        console.error("Update Role Error:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du rôle." });
    }
};

// Delete a role
exports.deleteRole = async (req, res) => {
    try {
        const churchId = req.user?.churchId || req.church?.id;
        const { id } = req.params;

        const role = await db.Role.findOne({ where: { id, churchId } });
        if (!role) return res.status(404).json({ message: "Rôle non trouvé." });

        await role.destroy();
        res.json({ message: "Rôle supprimé avec succès." });
    } catch (error) {
        console.error("Delete Role Error:", error);
        res.status(500).json({ message: "Erreur lors de la suppression du rôle." });
    }
};
