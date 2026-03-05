const db = require("../models");
const MaintenanceLog = db.MaintenanceLog;
const Room = db.Room;
const InventoryItem = db.InventoryItem;
const User = db.User;

// Create a new maintenance request
exports.createMaintenanceLog = async (req, res) => {
    try {
        const churchId = req.church.id;
        const { entityType, entityId, description, assignedTo, priority } = req.body;

        // Basic validation
        if (!entityType || !entityId || !description) {
            return res.status(400).json({ message: "Champs requis manquants." });
        }

        const newLog = await MaintenanceLog.create({
            churchId,
            entityType,
            entityId,
            description,
            reportedBy: req.user.id, // Logged in user reports it
            assignedTo: assignedTo || null,
            status: 'reported'
        });

        // Optionally update the status of the entity itself
        if (entityType === 'room') {
            await Room.update({ status: 'maintenance' }, { where: { id: entityId, churchId } });
        } else if (entityType === 'inventory_item') {
            await InventoryItem.update({ status: 'reparer' }, { where: { id: entityId, churchId } });
        }

        res.status(201).json(newLog);
    } catch (error) {
        console.error("Error creating maintenance log:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get all maintenance logs
exports.getAllMaintenanceLogs = async (req, res) => {
    try {
        const churchId = req.church.id;
        const logs = await MaintenanceLog.findAll({
            where: { churchId },
            include: [
                { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName'] }, // Ensure alias matches association
                { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(logs);
    } catch (error) {
        console.error("Error fetching maintenance logs:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update maintenance log (e.g., status, cost, resolution)
exports.updateMaintenanceLog = async (req, res) => {
    try {
        const churchId = req.church.id;
        const { id } = req.params;
        const { status, cost, assignedTo, resolutionNotes } = req.body;

        const log = await MaintenanceLog.findOne({ where: { id, churchId } });
        if (!log) {
            return res.status(404).json({ message: "Maintenance log not found." });
        }

        let updateData = {};
        if (status) updateData.status = status;
        if (cost) updateData.cost = cost;
        if (assignedTo) updateData.assignedTo = assignedTo;
        if (resolutionNotes) updateData.description = log.description + "\n\nResolution: " + resolutionNotes; // Append resolution notes
        if (status === 'resolved') updateData.dateResolved = new Date();

        await log.update(updateData);

        // If resolved, restore the entity status
        if (status === 'resolved') {
            if (log.entityType === 'room') {
                await Room.update({ status: 'active' }, { where: { id: log.entityId, churchId } });
            } else if (log.entityType === 'inventory_item') {
                await InventoryItem.update({ status: 'bon_etat' }, { where: { id: log.entityId, churchId } });
            }
        }

        res.status(200).json(log);
    } catch (error) {
        console.error("Error updating maintenance log:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteMaintenanceLog = async (req, res) => {
    try {
        const churchId = req.church.id;
        const { id } = req.params;
        // Logic to delete...
        await MaintenanceLog.destroy({ where: { id, churchId } });
        res.status(200).json({ message: "Maintenance log deleted." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
