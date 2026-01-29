const db = require('../models');

exports.createCeremony = async (req, res) => {
    try {
        const { type, title, date, description, participants } = req.body;
        const ceremony = await db.Ceremony.create({
            churchId: req.user.churchId,
            type,
            title,
            date,
            description,
            participants
        });
        res.status(201).json(ceremony);
    } catch (error) {
        console.error("Create Ceremony Error:", error);
        res.status(500).json({ message: "Erreur lors de la création de la cérémonie" });
    }
};

exports.getCeremonies = async (req, res) => {
    try {
        const ceremonies = await db.Ceremony.findAll({
            where: { churchId: req.user.churchId },
            order: [['date', 'DESC']]
        });
        res.json(ceremonies);
    } catch (error) {
        console.error("Get Ceremonies Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération" });
    }
};
