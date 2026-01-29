const db = require('../models');
const { v4: uuidv4 } = require('uuid');

// Create Activity
exports.createActivity = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description, date, endDate, location } = req.body;

        const group = await db.Group.findOne({ where: { id: groupId, churchId: req.church.id } });
        if (!group) return res.status(404).json({ message: "Groupe non trouvé." });

        const activity = await db.GroupActivity.create({
            groupId,
            name,
            description,
            date,
            endDate,
            startTime: req.body.startTime || null,
            location,
            coordinatorId: req.body.coordinatorId || null,
            status: 'planned',
            registrationExpiresAt: req.body.registrationExpiresAt,
            registrationToken: req.body.registrationExpiresAt ? uuidv4() : null
        });

        res.status(201).json({ message: "Activité créée.", activity });
    } catch (err) {
        console.error("Create Activity Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Get Group Activities
exports.getGroupActivities = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await db.Group.findOne({ where: { id: groupId, churchId: req.church.id } });
        if (!group) return res.status(404).json({ message: "Groupe non trouvé." });

        const activities = await db.GroupActivity.findAll({
            where: { groupId },
            include: [{
                model: db.ActivityParticipant,
                as: 'participants',
                include: [{
                    model: db.User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'photo', 'phone', 'email']
                }]
            }, {
                model: db.User,
                as: 'coordinator',
                attributes: ['firstName', 'lastName', 'photo']
            }],
            order: [['date', 'DESC']]
        });

        res.json(activities);
    } catch (err) {
        console.error("Get Activities Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Get Activity Details
exports.getActivityDetails = async (req, res) => {
    try {
        const { activityId } = req.params;
        const activity = await db.GroupActivity.findByPk(activityId, {
            include: [{
                model: db.ActivityParticipant,
                as: 'participants',
                include: [{
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'photo', 'phone']
                }]
            }, {
                model: db.User,
                as: 'coordinator',
                attributes: ['id', 'firstName', 'lastName', 'photo']
            }]
        });

        if (!activity) return res.status(404).json({ message: "Activité non trouvée." });

        res.json(activity);
    } catch (err) {
        console.error("Get Activity Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Update Activity
exports.updateActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        const activity = await db.GroupActivity.findByPk(activityId);

        if (!activity) return res.status(404).json({ message: "Activité non trouvée." });

        const updateData = { ...req.body };
        if (updateData.coordinatorId === '') updateData.coordinatorId = null;

        await activity.update(updateData);

        res.json({ message: "Activité mise à jour.", activity });
    } catch (err) {
        console.error("Update Activity Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Delete Activity
exports.deleteActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        const activity = await db.GroupActivity.findByPk(activityId);

        if (!activity) return res.status(404).json({ message: "Activité non trouvée." });

        await activity.destroy();

        res.json({ message: "Activité supprimée." });
    } catch (err) {
        console.error("Delete Activity Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Manage Participants
exports.addParticipant = async (req, res) => {
    try {
        const { activityId } = req.params;
        let { userId, status = 'invited', guestName, guestEmail, guestPhone } = req.body;

        console.log("Adding Participant Payload:", req.body);

        // Sanitize userId
        if (userId && (typeof userId === 'object' || userId === '')) userId = null;

        if (userId) {
            const exists = await db.ActivityParticipant.findOne({ where: { activityId, userId } });
            if (exists) return res.status(400).json({ message: "Déjà participant." });

            await db.ActivityParticipant.create({
                activityId,
                userId,
                status
            });
        } else if (guestName) {
            await db.ActivityParticipant.create({
                activityId,
                userId: null,
                status,
                guestName,
                guestEmail,
                guestPhone
            });
        } else {
            console.log("Données manquantes:", req.body);
            return res.status(400).json({ message: "Données manquantes.", received: req.body });
        }

        res.status(201).json({ message: "Participant ajouté." });
    } catch (err) {
        console.error("Add Participant Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.updateParticipantStatus = async (req, res) => {
    try {
        const { participantId } = req.params;
        const { status, notes } = req.body;

        const participant = await db.ActivityParticipant.findByPk(participantId);
        if (!participant) return res.status(404).json({ message: "Participant non trouvé." });

        await participant.update({ status, notes });

        res.json({ message: "Statut mis à jour." });
    } catch (err) {
        console.error("Update Participant Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.removeParticipant = async (req, res) => {
    try {
        const { participantId } = req.params;
        const participant = await db.ActivityParticipant.findByPk(participantId);

        if (!participant) return res.status(404).json({ message: "Participant non trouvé." });

        await participant.destroy();
        res.json({ message: "Participant retiré." });
    } catch (err) {
        console.error("Remove Participant Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
