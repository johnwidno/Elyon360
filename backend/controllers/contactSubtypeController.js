const db = require('../models');

exports.getAllSubtypes = async (req, res) => {
    try {
        const subtypes = await db.ContactSubtype.findAll({
            where: { churchId: req.church.id },
            include: [{ model: db.ContactType, as: 'type' }],
            order: [['name', 'ASC']]
        });
        res.json(subtypes);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.createSubtype = async (req, res) => {
    try {
        const subtype = await db.ContactSubtype.create({
            ...req.body,
            churchId: req.church.id
        });
        res.status(201).json(subtype);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la création du sous-type" });
    }
};

exports.updateSubtype = async (req, res) => {
    try {
        const { id } = req.params;
        await db.ContactSubtype.update(req.body, { where: { id, churchId: req.church.id } });
        res.json({ message: "Sous-type mis à jour" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
};

exports.deleteSubtype = async (req, res) => {
    try {
        const { id } = req.params;
        await db.ContactSubtype.destroy({ where: { id, churchId: req.church.id } });
        res.json({ message: "Sous-type supprimé" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};
