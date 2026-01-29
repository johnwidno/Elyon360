const db = require('../models');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await db.Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await db.Notification.update({ isRead: true }, {
            where: { id, userId: req.user.id }
        });
        res.json({ message: "Notification lue" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
};
