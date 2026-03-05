const db = require('../models');
const MemberAlert = db.MemberAlert;

// GET all alerts for a member
exports.getAlerts = async (req, res) => {
    try {
        const alerts = await MemberAlert.findAll({
            where: { userId: req.params.memberId, churchId: req.church.id, isActive: true },
            order: [['createdAt', 'DESC']]
        });
        res.json(alerts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des alertes' });
    }
};

// POST create alert
exports.createAlert = async (req, res) => {
    try {
        const { message } = req.body;
        const alert = await MemberAlert.create({
            userId: req.params.memberId,
            churchId: req.church.id,
            message
        });
        res.status(201).json(alert);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la création de l'alerte" });
    }
};

// DELETE (deactivate) alert
exports.deleteAlert = async (req, res) => {
    try {
        await MemberAlert.update({ isActive: false }, {
            where: { id: req.params.alertId, churchId: req.church.id }
        });
        res.json({ message: 'Alerte supprimée' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la suppression de l'alerte" });
    }
};
