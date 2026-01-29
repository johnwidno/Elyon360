const db = require('../models');

exports.createOrganization = async (req, res) => {
    try {
        const { email } = req.body;
        if (email) {
            const existing = await db.Organization.findOne({
                where: { email, churchId: req.church.id }
            });
            if (existing) return res.status(400).json({ message: "Cet email est déjà utilisé par une autre organisation." });
        }

        const org = await db.Organization.create({
            ...req.body,
            churchId: req.church.id
        });

        // Fetch again with inclusion
        const fullOrg = await db.Organization.findByPk(org.id, {
            include: [{ model: db.ContactSubtype, as: 'subtype' }]
        });

        res.status(201).json(fullOrg);
    } catch (error) {
        console.error("CreateOrg Error:", error);
        res.status(500).json({ message: "Erreur lors de la création de l'organisation" });
    }
};

exports.getAllOrganizations = async (req, res) => {
    try {
        const churchId = req.church.id;

        const orgs = await db.Organization.findAll({
            where: { churchId: churchId },
            include: [{ model: db.ContactSubtype, as: 'subtype' }],
            order: [
                ['isSystem', 'DESC'],
                ['name', 'ASC']
            ]
        });

        res.json(orgs);
    } catch (error) {
        console.error("GetAllOrgs Error:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.getOneOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const org = await db.Organization.findOne({
            where: { id, churchId: req.church.id },
            include: [
                { model: db.ContactSubtype, as: 'subtype' },
                { model: db.Donation, as: 'donations' },
                { model: db.Group, as: 'partnerGroups' },
                { model: db.Event, as: 'attendedEvents' },
                { model: db.Ceremony, as: 'attendedCeremonies' }
            ],
            order: [
                [{ model: db.Donation, as: 'donations' }, 'date', 'DESC']
            ]
        });
        if (!org) return res.status(404).json({ message: "Organisation non trouvée" });
        res.json(org);
    } catch (error) {
        console.error("GetOneOrg Error:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.updateOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};
        const fields = ['name', 'address', 'website', 'logo', 'subtypeId', 'status', 'statusChangeDate'];
        fields.forEach(f => {
            if (req.body[f] !== undefined) updateData[f] = req.body[f];
        });

        await db.Organization.update(updateData, {
            where: { id, churchId: req.church.id }
        });

        const updatedOrg = await db.Organization.findByPk(id, {
            include: [{ model: db.ContactSubtype, as: 'subtype' }]
        });

        res.json(updatedOrg);
    } catch (error) {
        console.error("UpdateOrg Error:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
};

exports.deleteOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const org = await db.Organization.findOne({ where: { id, churchId: req.church.id } });

        if (!org) return res.status(404).json({ message: "Organisation non trouvée" });
        if (org.isSystem) return res.status(403).json({ message: "Impossible de supprimer l'organisation système" });

        await org.destroy();
        res.json({ message: "Organisation supprimée" });
    } catch (error) {
        console.error("DeleteOrg Error:", error);
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};
