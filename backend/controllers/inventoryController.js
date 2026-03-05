const db = require('../models');

exports.addItem = async (req, res) => {
    try {
        const { name, description, quantity, categoryId, roomId, status, isShared } = req.body;
        const churchId = req.user.churchId || req.church?.id;

        const item = await db.InventoryItem.create({
            churchId,
            name,
            description,
            quantity,
            quantity_available: quantity, // Default to total quantity
            categoryId,
            roomId,
            status,
            isShared
        });
        res.status(201).json(item);
    } catch (error) {
        console.error("Add Item Error:", error);
        res.status(500).json({ message: "Erreur lors de l'ajout de l'article" });
    }
};

exports.getItems = async (req, res) => {
    try {
        const churchId = req.user.churchId || req.church?.id;
        const items = await db.InventoryItem.findAll({
            where: { churchId },
            order: [['name', 'ASC']]
        });
        res.json(items);
    } catch (error) {
        console.error("Get Items Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération de l'inventaire" });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, quantity, categoryId, roomId, status, isShared } = req.body;
        const churchId = req.user.churchId || req.church?.id;

        const item = await db.InventoryItem.findOne({
            where: { id, churchId }
        });

        if (!item) return res.status(404).json({ message: "Article non trouvé" });

        await item.update({
            name,
            description,
            quantity,
            categoryId,
            roomId,
            status,
            isShared
        });
        res.json(item);
    } catch (error) {
        console.error("Update Item Error:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.user.churchId || req.church?.id;
        const item = await db.InventoryItem.findOne({
            where: { id, churchId }
        });

        if (!item) return res.status(404).json({ message: "Article non trouvé" });

        await item.destroy();
        res.json({ message: "Article supprimé" });
    } catch (error) {
        console.error("Delete Item Error:", error);
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};
