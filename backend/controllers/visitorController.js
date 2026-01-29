const db = require('../models');

// Create a new visitor (Public Site)
exports.registerVisitor = async (req, res) => {
    try {
        const { churchId, fullName, email, phone } = req.body;

        const visitor = await db.Visitor.create({
            churchId,
            fullName,
            email,
            phone,
            status: 'new'
        });

        res.status(201).json({ message: "Inscription réussie !", visitor });
    } catch (error) {
        console.error("Visitor Registration Error:", error);
        res.status(500).json({ message: "Erreur lors de l'inscription." });
    }
};

// Get all visitors (Admin)
exports.getAllVisitors = async (req, res) => {
    try {
        const visitors = await db.Visitor.findAll({
            where: { churchId: req.church.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(visitors);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Update visitor status
exports.updateVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        await db.Visitor.update(req.body, {
            where: { id, churchId: req.church.id }
        });
        res.json({ message: "Visiteur mis à jour" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
};

// Delete visitor
exports.deleteVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        await db.Visitor.destroy({
            where: { id, churchId: req.church.id }
        });
        res.json({ message: "Visiteur supprimé" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};
