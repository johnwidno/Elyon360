const db = require('../models');

exports.getAllTypes = async (req, res) => {
    try {
        const types = await db.ContactType.findAll({
            where: { churchId: req.church.id },
            include: [{ model: db.ContactSubtype, as: 'subtypes' }],
            order: [['name', 'ASC']]
        });
        res.json(types);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.createType = async (req, res) => {
    try {
        const type = await db.ContactType.create({
            ...req.body,
            churchId: req.church.id,
            isSystem: false
        });
        res.status(201).json(type);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la création du type" });
    }
};

exports.updateType = async (req, res) => {
    try {
        const { id } = req.params;
        const type = await db.ContactType.findOne({ where: { id, churchId: req.church.id } });
        if (type.isSystem) return res.status(403).json({ message: "Impossible de modifier un type système." });

        await db.ContactType.update(req.body, { where: { id, churchId: req.church.id } });
        res.json({ message: "Type mis à jour" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
};

exports.deleteType = async (req, res) => {
    try {
        const { id } = req.params;
        const type = await db.ContactType.findOne({ where: { id, churchId: req.church.id } });
        if (type.isSystem) return res.status(403).json({ message: "Impossible de supprimer un type système." });

        await db.ContactType.destroy({ where: { id, churchId: req.church.id } });
        res.json({ message: "Type supprimé" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};
