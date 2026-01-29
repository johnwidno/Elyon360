const db = require('../models');

class PublicEventController {
    async getEventByToken(req, res) {
        try {
            const { token } = req.params;
            const event = await db.Event.findOne({
                where: { registrationToken: token },
                include: [{
                    model: db.Church,
                    as: 'church',
                    attributes: ['name']
                }]
            });

            if (!event) return res.status(404).json({ message: "Lien invalide ou événement introuvable." });

            if (event.registrationExpiresAt && new Date() > new Date(event.registrationExpiresAt)) {
                return res.status(410).json({ message: "Le lien d'inscription a expiré." });
            }

            // Check if already registered by IP
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const alreadyRegistered = await db.EventParticipant.findOne({
                where: {
                    eventId: event.id,
                    guestIp: ip
                }
            });

            res.json({
                id: event.id,
                title: event.title,
                description: event.description,
                startDate: event.startDate,
                endDate: event.endDate,
                location: event.location,
                churchName: event.church?.name,
                alreadyRegistered: !!alreadyRegistered
            });
        } catch (err) {
            console.error("Get Public Event Error:", err);
            res.status(500).json({ message: "Erreur serveur." });
        }
    }

    async registerGuest(req, res) {
        try {
            const { token } = req.params;
            const { guestName, guestEmail, guestPhone } = req.body;

            const event = await db.Event.findOne({ where: { registrationToken: token } });
            if (!event) return res.status(404).json({ message: "Événement non trouvé." });

            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

            const participant = await db.EventParticipant.create({
                eventId: event.id,
                guestName,
                guestEmail,
                guestPhone,
                guestIp: ip,
                status: 'confirmed'
            });

            res.status(201).json({ message: "Inscription réussie !", participant });
        } catch (err) {
            console.error("Register Guest Error:", err);
            res.status(500).json({ message: "Erreur lors de l'inscription." });
        }
    }

    async registerMember(req, res) {
        try {
            const { token } = req.params;
            const { email, password, memberCode } = req.body;
            const bcrypt = require('bcryptjs');

            const event = await db.Event.findOne({ where: { registrationToken: token } });
            if (!event) return res.status(404).json({ message: "Événement non trouvé." });

            if (event.registrationExpiresAt && new Date() > new Date(event.registrationExpiresAt)) {
                return res.status(410).json({ message: "Le lien d'inscription a expiré." });
            }

            // Find user by email AND memberCode
            const user = await db.User.findOne({
                where: {
                    email,
                    memberCode,
                    churchId: event.churchId
                }
            });

            if (!user) return res.status(401).json({ message: "Identifiants ou Code Membre invalide." });

            // Verify password
            const validPass = await bcrypt.compare(password, user.password);
            if (!validPass) return res.status(401).json({ message: "Mot de passe incorrect." });

            // Check if already registered
            const [participant, created] = await db.EventParticipant.findOrCreate({
                where: { eventId: event.id, userId: user.id },
                defaults: { status: 'confirmed', notes: 'Inscription membre via lien public' }
            });

            if (!created) return res.status(400).json({ message: "Vous êtes déjà inscrit à cet événement." });

            res.status(201).json({ message: `Ravi de vous voir, ${user.firstName} ! Inscription réussie.` });
        } catch (err) {
            if (err.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ message: "Vous êtes déjà inscrit à cet événement." });
            }
            console.error("Register Member Error:", err);
            res.status(500).json({ message: "Erreur lors de l'inscription." });
        }
    }
}

module.exports = new PublicEventController();
