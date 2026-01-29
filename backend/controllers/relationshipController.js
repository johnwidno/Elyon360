const db = require('../models');
const Relationship = db.Relationship;
const OrganizationMember = db.OrganizationMember;
const User = db.User;
const Organization = db.Organization;

// ==========================================
// MEMBER-TO-MEMBER RELATIONSHIPS
// ==========================================

// Add a family relationship
exports.addRelationship = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const { personAId, personBId, type, details } = req.body;

        if (!personAId || !personBId || !type) {
            return res.status(400).json({ message: "Les champs Personne A, Personne B et Type sont requis." });
        }

        const newRelationship = await Relationship.create({
            churchId,
            personAId,
            personBId,
            type,
            details
        });

        // Sync spouseName if this is a Conjoint relationship
        if (type && type.toLowerCase().includes('conjoint')) {
            const personA = await User.findByPk(personAId);
            const personB = await User.findByPk(personBId);

            if (personA && personB) {
                await personA.update({
                    spouseName: `${personB.firstName} ${personB.lastName}`
                });
            }
        }

        res.status(201).json(newRelationship);
    } catch (error) {
        console.error("Add Relationship Error:", error);
        res.status(500).json({ message: "Erreur lors de l'ajout de la relation." });
    }
};

// Get relationships for a specific user
exports.getUserRelationships = async (req, res) => {
    try {
        const { userId } = req.params;
        const churchId = req.user.churchId;

        // Fetch relationships where user is Person A
        const relationshipsA = await Relationship.findAll({
            where: { churchId, personAId: userId },
            include: [{ model: User, as: 'personB', attributes: ['id', 'firstName', 'lastName', 'photo'] }]
        });

        // Fetch relationships where user is Person B (reciprocal)
        const relationshipsB = await Relationship.findAll({
            where: { churchId, personBId: userId },
            include: [{ model: User, as: 'personA', attributes: ['id', 'firstName', 'lastName', 'photo'] }]
        });

        // Combine and format
        const cleanRelationships = [
            ...relationshipsA.map(r => ({
                id: r.id,
                person: r.personB,
                type: r.type,
                details: r.details,
                isReciprocal: false
            })),
            ...relationshipsB.map(r => ({
                id: r.id,
                person: r.personA,
                type: r.type + ' (Inverse)', // Ideally we map inverse types (Parent -> Child)
                details: r.details,
                isReciprocal: true
            }))
        ];

        res.json(cleanRelationships);
    } catch (error) {
        console.error("Get Relationships Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des relations." });
    }
};

// Delete a relationship
exports.deleteRelationship = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.user.churchId;

        // Find the relationship before deleting to check if it's a spouse
        const relationship = await Relationship.findOne({
            where: { id, churchId }
        });

        if (relationship && relationship.type && relationship.type.toLowerCase().includes('conjoint')) {
            // Clear spouseName for personA
            await User.update(
                { spouseName: null },
                { where: { id: relationship.personAId } }
            );
        }

        await Relationship.destroy({
            where: { id, churchId }
        });

        res.json({ message: "Relation supprimée avec succès." });
    } catch (error) {
        console.error("Delete Relationship Error:", error);
        res.status(500).json({ message: "Erreur lors de la suppression." });
    }
};

// ==========================================
// ORGANIZATION MEMBERSHIPS (ROLES)
// ==========================================

// Add a member to an organization (with role)
exports.addOrganizationRole = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const { userId, organizationId, role, details } = req.body;

        if (!userId || !organizationId) {
            return res.status(400).json({ message: "Membre et Organisation sont requis." });
        }

        const newRole = await OrganizationMember.create({
            churchId,
            userId,
            organizationId,
            role: role || 'Member',
            status: 'Active',
            startDate: new Date()
        });

        res.status(201).json(newRole);
    } catch (error) {
        console.error("Add Org Role Error:", error);
        res.status(500).json({ message: "Erreur lors de l'ajout du rôle." });
    }
};

// Get organization roles for a user
exports.getUserOrganizationRoles = async (req, res) => {
    try {
        const { userId } = req.params;
        const churchId = req.user.churchId;

        const roles = await OrganizationMember.findAll({
            where: { churchId, userId },
            include: [{ model: Organization, as: 'organization', attributes: ['id', 'name', 'logo', 'type'] }]
        });

        res.json(roles);
    } catch (error) {
        console.error("Get User Org Roles Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des rôles." });
    }
};

// Delete an organization role
exports.deleteOrganizationRole = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.user.churchId;

        await OrganizationMember.destroy({
            where: { id, churchId }
        });

        res.json({ message: "Rôle supprimé avec succès." });
    } catch (error) {
        console.error("Delete Org Role Error:", error);
        res.status(500).json({ message: "Erreur lors de la suppression." });
    }
};
