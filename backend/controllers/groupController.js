const db = require('../models');
const roomScheduler = require('../services/roomScheduler');

// Helper to get next date for a day name
const getNextDateForDay = (dayName) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const targetIndex = days.indexOf(dayName.toLowerCase());
    if (targetIndex === -1) return new Date().toISOString().split('T')[0]; // Default to today if invalid

    const d = new Date();
    const currentDay = d.getDay();
    let diff = targetIndex - currentDay;
    if (diff <= 0) diff += 7; // Next occurrence
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
};

// Create Group
exports.createGroup = async (req, res) => {
    try {
        if (!req.church) return res.status(400).json({ message: "Contexte manquant." });

        const { name, description, type, leaderId, leaderName, roomId, recurringSchedule, logo, charter } = req.body;

        // Check Conflict for Recurring Schedule
        if (roomId && recurringSchedule) {
            let schedule = recurringSchedule;
            if (typeof schedule === 'string') {
                try { schedule = JSON.parse(schedule); } catch (e) { }
            }

            if (schedule && schedule.day && schedule.startTime && schedule.endTime) {
                // Time Validation
                if (schedule.startTime >= schedule.endTime) {
                    return res.status(400).json({ message: "L'heure de début doit être antérieure à l'heure de fin." });
                }

                const checkDate = getNextDateForDay(schedule.day);
                const availability = await roomScheduler.checkRoomAvailability({
                    churchId: req.church.id,
                    roomId,
                    date: checkDate,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    type: 'group'
                });

                if (!availability.available) {
                    return res.status(409).json({
                        message: `La salle est déjà occupée le ${schedule.day} sur ce créneau par : ${availability.conflict.details.name || availability.conflict.details.title}.`,
                        conflict: availability.conflict
                    });
                }
            }
        }

        const group = await db.Group.create({
            churchId: req.church.id,
            name,
            description,
            type,
            leaderName,
            roomId: roomId || null,
            recurringSchedule,
            logo,
            charter
        });

        // If a leader was selected, automatically add them as first member
        if (leaderId) {
            try {
                await db.GroupMember.create({
                    groupId: group.id,
                    userId: parseInt(leaderId),
                    role: 'responsable',
                    joinedAt: new Date()
                });
            } catch (memberErr) {
                console.error("Error adding leader as member:", memberErr);
                // Don't fail the group creation if adding member fails
            }
        }

        res.status(201).json({ message: "Groupe créé.", group });
    } catch (err) {
        console.error("Create Group Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Get All Groups
exports.getAllGroups = async (req, res) => {
    try {
        if (!req.church) return res.status(400).json({ message: "Contexte manquant." });

        const groups = await db.Group.findAll({
            where: { churchId: req.church.id },
            attributes: {
                include: [
                    [
                        db.sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM group_members AS gm
                            WHERE
                                gm."groupId" = "group"."id"
                        )`),
                        'memberCount'
                    ]
                ]
            },
            order: [['name', 'ASC']]
        });

        res.json(groups);
    } catch (err) {
        console.error("Get Groups Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Update Group
exports.updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, type, status, leaderName, roomId, recurringSchedule, logo, charter } = req.body;

        const group = await db.Group.findOne({ where: { id: id, churchId: req.church.id } });

        if (!group) return res.status(404).json({ message: "Groupe non trouvé." });

        // Check Conflict for Recurring Schedule Update
        if (roomId && recurringSchedule) {
            let schedule = recurringSchedule;
            if (typeof schedule === 'string') {
                try { schedule = JSON.parse(schedule); } catch (e) { }
            }

            // Only check if schedule/room allows it
            if (schedule && schedule.day && schedule.startTime && schedule.endTime) {
                // Time Validation
                if (schedule.startTime >= schedule.endTime) {
                    return res.status(400).json({ message: "L'heure de début doit être antérieure à l'heure de fin." });
                }

                const checkDate = getNextDateForDay(schedule.day);
                const availability = await roomScheduler.checkRoomAvailability({
                    churchId: req.church.id,
                    roomId,
                    date: checkDate,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    excludeId: id,
                    type: 'group'
                });

                if (!availability.available) {
                    return res.status(409).json({
                        message: `La salle est déjà occupée le ${schedule.day} sur ce créneau par : ${availability.conflict.details.name || availability.conflict.details.title}.`,
                        conflict: availability.conflict
                    });
                }
            }
        }

        await group.update({
            name,
            description,
            type,
            status,
            leaderName,
            roomId: roomId || null,
            recurringSchedule,
            logo,
            charter
        });

        res.json({ message: "Groupe mis à jour.", group });
    } catch (err) {
        console.error("Update Group Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Delete Group
exports.deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await db.Group.findOne({ where: { id, churchId: req.church.id } });

        if (!group) return res.status(404).json({ message: "Groupe non trouvé." });

        await group.destroy();
        res.json({ message: "Groupe supprimé." });
    } catch (err) {
        console.error("Delete Group Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Get Group Members
exports.getGroupMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await db.Group.findOne({
            where: { id, churchId: req.church.id },
            include: [
                {
                    model: db.User,
                    as: 'groupMembers',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'photo', 'phone', 'memberCode'],
                    through: { attributes: ['role', 'joinedAt', 'status', 'statusChangedAt'] }
                },
                {
                    model: db.Room,
                    as: 'room',
                    include: [{ model: db.Building, as: 'building', attributes: ['name'] }]
                }
            ]
        });

        if (!group) return res.status(404).json({ message: "Groupe non trouvé." });

        res.json(group);
    } catch (err) {
        console.error("Get Group Members Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Add Member to Group
exports.addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const groupId = parseInt(id);
        const { userId, role, joinedAt, status, statusChangedAt } = req.body;
        const uId = parseInt(userId);

        const group = await db.Group.findOne({ where: { id: groupId, churchId: req.church.id } });
        if (!group) return res.status(404).json({ message: "Groupe non trouvé." });

        const member = await db.User.findOne({ where: { id: uId, churchId: req.church.id } });
        if (!member) return res.status(404).json({ message: "Membre non trouvé." });

        // Check if already in group
        const existing = await db.GroupMember.findOne({ where: { groupId, userId: uId } });
        if (existing) return res.status(400).json({ message: "Ce membre est déjà dans ce groupe." });

        await db.GroupMember.create({
            groupId,
            userId: uId,
            role: role || 'membre',
            status: status || 'active',
            statusChangedAt: statusChangedAt || new Date(),
            joinedAt: joinedAt || new Date()
        });

        res.status(201).json({ message: "Membre ajouté au groupe." });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: "Ce membre est déjà dans ce groupe." });
        }
        console.error("Add Member Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Remove Member from Group
exports.removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;

        const group = await db.Group.findOne({ where: { id, churchId: req.church.id } });
        if (!group) return res.status(404).json({ message: "Groupe non trouvé." });

        const deleted = await db.GroupMember.destroy({ where: { groupId: id, userId } });
        if (!deleted) return res.status(404).json({ message: "Membre non trouvé dans ce groupe." });

        res.json({ message: "Membre retiré du groupe." });
    } catch (err) {
        console.error("Remove Member Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Update Member Role
exports.updateMemberRole = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { role, status, statusChangedAt, joinedAt } = req.body;

        const groupMember = await db.GroupMember.findOne({ where: { groupId: id, userId } });

        // Verify group belongs to church context logic if stricter check needed, 
        // but simple ID check usually suffices if properly scoped. 
        // Ideally we should check if group exists in church first, but for speed:
        const group = await db.Group.findOne({ where: { id, churchId: req.church.id } });
        if (!group) return res.status(404).json({ message: "Groupe non trouvé." });

        if (!groupMember) return res.status(404).json({ message: "Membre non trouvé dans ce groupe." });

        // Prepare update object with only provided fields
        const updateData = {};
        if (role !== undefined) updateData.role = role;
        if (status !== undefined) updateData.status = status;
        if (statusChangedAt !== undefined) updateData.statusChangedAt = statusChangedAt;
        if (joinedAt !== undefined) updateData.joinedAt = joinedAt;

        await groupMember.update(updateData);

        res.json({ message: "Membre mis à jour." });
    } catch (err) {
        console.error("Update Member Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
