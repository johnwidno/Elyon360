const db = require('../models');
const { v4: uuidv4 } = require('uuid');

// Create Event
exports.createEvent = async (req, res) => {
    try {
        console.log("Create Event Request Body:", req.body); // DEBUG
        console.log("Church Context:", req.church ? req.church.id : "MISSING"); // DEBUG

        if (!req.church) return res.status(400).json({ message: "Contexte manquant (Church not found)." });

        const { title, description, startDate, endDate, location, type, status, registrationExpiresAt } = req.body;

        const event = await db.Event.create({
            churchId: req.church.id,
            title,
            description,
            startDate,
            endDate,
            location,
            type,
            status: status || 'planned',
            registrationExpiresAt: registrationExpiresAt || null,
            registrationToken: registrationExpiresAt ? uuidv4() : null
        });

        res.status(201).json({ message: "Événement créé.", event });
    } catch (err) {
        console.error("Create Event Error FULL:", err); // DEBUG
        res.status(500).json({ message: "Erreur serveur.", error: err.message });
    }
};

// Get All Events
exports.getAllEvents = async (req, res) => {
    try {
        if (!req.church) return res.status(400).json({ message: "Contexte manquant." });

        const events = await db.Event.findAll({
            where: { churchId: req.church.id },
            include: [{
                model: db.EventParticipant,
                as: 'eventParticipants' // Fixed alias from model index
            }],
            order: [['startDate', 'ASC']]
        });

        res.json(events);
    } catch (err) {
        console.error("Get Events Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Update Event
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await db.Event.findOne({ where: { id, churchId: req.church.id } });
        if (!event) return res.status(404).json({ message: "Événement non trouvé." });

        const updateData = { ...req.body };

        // Generate token if expiration is set and no token exists
        if (updateData.registrationExpiresAt && !event.registrationToken) {
            updateData.registrationToken = uuidv4();
        }

        await event.update(updateData);

        res.json({ message: "Événement mis à jour.", event });
    } catch (err) {
        console.error("Update Event Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await db.Event.findOne({ where: { id, churchId: req.church.id } });

        if (!event) return res.status(404).json({ message: "Événement non trouvé." });

        await event.destroy();
        res.json({ message: "Événement supprimé." });
    } catch (err) {
        console.error("Delete Event Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Get Event Details (with participants)
exports.getEventDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await db.Event.findOne({
            where: { id, churchId: req.church.id },
            include: [{
                model: db.EventParticipant,
                as: 'eventParticipants',
                include: [{
                    model: db.User,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'photo', 'phone', 'email']
                }]
            }]
        });

        if (!event) return res.status(404).json({ message: "Événement non trouvé." });
        res.json(event);
    } catch (err) {
        console.error("Get Event Details Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Add Participant (Member)
exports.addMemberParticipant = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const event = await db.Event.findOne({ where: { id, churchId: req.church.id } });
        if (!event) return res.status(404).json({ message: "Événement non trouvé." });

        const [participant, created] = await db.EventParticipant.findOrCreate({
            where: { eventId: id, userId },
            defaults: { status: 'confirmed' }
        });

        if (!created) return res.status(400).json({ message: "Ce membre est déjà inscrit." });

        res.status(201).json({ message: "Participant ajouté.", participant });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: "Ce membre est déjà inscrit." });
        }
        console.error("Add Member Participant Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Add Participant (Guest) - Manual from Admin
exports.addGuestParticipant = async (req, res) => {
    try {
        const { id } = req.params;
        const { guestName, guestEmail, guestPhone } = req.body;

        const event = await db.Event.findOne({ where: { id, churchId: req.church.id } });
        if (!event) return res.status(404).json({ message: "Événement non trouvé." });

        const participant = await db.EventParticipant.create({
            eventId: id,
            guestName,
            guestEmail,
            guestPhone,
            status: 'confirmed',
            notes: 'Ajout direct par administrateur'
        });

        res.status(201).json({ message: "Invité ajouté.", participant });
    } catch (err) {
        console.error("Add Guest Participant Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Remove Participant
exports.removeParticipant = async (req, res) => {
    try {
        const { id, participantId } = req.params;
        const event = await db.Event.findOne({ where: { id, churchId: req.church.id } });
        if (!event) return res.status(404).json({ message: "Événement non trouvé." });

        const participant = await db.EventParticipant.findOne({ where: { id: participantId, eventId: id } });
        if (!participant) return res.status(404).json({ message: "Participant non trouvé." });

        await participant.destroy();
        res.json({ message: "Participant supprimé." });
    } catch (err) {
        console.error("Remove Participant Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
