const db = require("../models");
const EventType = db.EventType;

exports.getAll = async (req, res) => {
    try {
        if (!req.church) {
            return res.status(400).send({ message: "Contexte de l'église manquant." });
        }
        const types = await EventType.findAll({
            where: { churchId: req.church.id, isActive: true },
            order: [['name', 'ASC']]
        });
        res.send(types);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        if (!req.church) {
            return res.status(400).send({ message: "Contexte de l'église manquant." });
        }
        if (!req.body.name) {
            return res.status(400).send({ message: "Name is required" });
        }
        const newType = await EventType.create({
            name: req.body.name,
            churchId: req.church.id
        });
        res.send(newType);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        if (!req.church) {
            return res.status(400).send({ message: "Contexte de l'église manquant." });
        }
        await EventType.destroy({
            where: { id: req.params.id, churchId: req.church.id }
        });
        res.send({ message: "Type deleted successfully" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};
