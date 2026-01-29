const db = require('../models');
const { Op } = require('sequelize');

// Get Activity by Token
exports.getActivityByToken = async (req, res) => {
    try {
        const { token } = req.params;
        const activity = await db.GroupActivity.findOne({
            where: { registrationToken: token },
            include: [{
                model: db.Group,
                as: 'group',
                attributes: ['name'],
                include: [{
                    model: db.Church,
                    as: 'church',
                    attributes: ['name']
                }]
            }]
        });

        if (!activity) return res.status(404).json({ message: "Lien invalide ou activité introuvable." });

        if (activity.registrationExpiresAt && new Date() > new Date(activity.registrationExpiresAt)) {
            return res.status(410).json({ message: "Le lien d'inscription a expiré." });
        }

        // Check if this IP is already registered
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const alreadyRegistered = await db.ActivityParticipant.findOne({
            where: {
                activityId: activity.id,
                guestIp: ip
            }
        });

        // Return only necessary public info
        res.json({
            id: activity.id,
            name: activity.name,
            description: activity.description,
            date: activity.date,
            endDate: activity.endDate,
            startTime: activity.startTime,
            location: activity.location,
            groupName: activity.group?.name,
            churchName: activity.group?.church?.name,
            alreadyRegistered: !!alreadyRegistered
        });
    } catch (err) {
        console.error("Get Public Activity Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Register Participant (Public)
exports.registerParticipant = async (req, res) => {
    try {
        const { token } = req.params;
        const { firstName, lastName, email, phone } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        const activity = await db.GroupActivity.findOne({ where: { registrationToken: token } });

        if (!activity) return res.status(404).json({ message: "Activité introuvable." });

        if (activity.registrationExpiresAt && new Date() > new Date(activity.registrationExpiresAt)) {
            return res.status(410).json({ message: "Le lien d'inscription a expiré." });
        }

        // Check for duplicate by IP OR Email OR Phone
        const existing = await db.ActivityParticipant.findOne({
            where: {
                activityId: activity.id,
                [Op.or]: [
                    { guestIp: ip },
                    ...(email ? [{ guestEmail: email }] : []),
                    ...(phone ? [{ guestPhone: phone }] : [])
                ]
            }
        });

        if (existing) return res.status(400).json({ message: "Vous êtes déjà inscrit à cette activité." });

        await db.ActivityParticipant.create({
            activityId: activity.id,
            guestName: `${firstName} ${lastName}`,
            guestEmail: email || null,
            guestPhone: phone || null,
            guestIp: ip,
            status: 'invited',
            notes: 'Inscription via lien public'
        });

        res.status(201).json({ message: "Inscription confirmée !" });
    } catch (err) {
        console.error("Public Register Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Register Participant (Member)
exports.registerMember = async (req, res) => {
    try {
        const { token } = req.params;
        const { email, password, memberCode } = req.body;
        const bcrypt = require('bcryptjs');

        const activity = await db.GroupActivity.findOne({ where: { registrationToken: token } });
        if (!activity) return res.status(404).json({ message: "Activité introuvable." });

        if (activity.registrationExpiresAt && new Date() > new Date(activity.registrationExpiresAt)) {
            return res.status(410).json({ message: "Le lien d'inscription a expiré." });
        }

        // Find user by email AND memberCode
        const user = await db.User.findOne({
            where: {
                email,
                memberCode,
                churchId: activity.groupId ? (await db.Group.findByPk(activity.groupId)).churchId : null
            }
        });

        if (!user) return res.status(401).json({ message: "Identifiants ou Code Membre invalide." });

        // Verify password
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(401).json({ message: "Mot de passe incorrect." });

        // Check if already registered
        const existing = await db.ActivityParticipant.findOne({
            where: { activityId: activity.id, userId: user.id }
        });

        if (existing) return res.status(400).json({ message: "Vous êtes déjà inscrit à cette activité." });

        await db.ActivityParticipant.create({
            activityId: activity.id,
            userId: user.id,
            status: 'invited',
            notes: 'Inscription membre via lien public'
        });

        res.status(201).json({ message: `Ravi de vous voir, ${user.firstName} ! Inscription confirmée.` });
    } catch (err) {
        console.error("Member Register Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

