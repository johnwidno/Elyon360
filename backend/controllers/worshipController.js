const db = require('../models');

// --- Worship Service Management ---

exports.createService = async (req, res) => {
    try {
        if (!req.church) return res.status(400).json({ message: "Contexte manquant." });
        const { theme, date, time, type, description, imageUrl, leaderId } = req.body;

        const service = await db.WorshipService.create({
            churchId: req.church.id,
            theme,
            date,
            time,
            type,
            description,
            imageUrl,
            leaderId: leaderId || null
        });

        res.status(201).json({ message: "Culte créé avec succès.", service });
    } catch (err) {
        console.error("Create Service Error:", err);
        res.status(500).json({ message: "Erreur serveur.", error: err.message });
    }
};

exports.getServices = async (req, res) => {
    try {
        if (!req.church) return res.status(400).json({ message: "Contexte manquant." });
        const services = await db.WorshipService.findAll({
            where: { churchId: req.church.id },
            include: [{ model: db.User, as: 'leader', attributes: ['firstName', 'lastName', 'photo'] }],
            order: [['date', 'DESC']]
        });
        res.json(services);
    } catch (err) {
        console.error("Get Services Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await db.WorshipService.findOne({
            where: { id, churchId: req.church.id },
            include: [
                { model: db.User, as: 'leader', attributes: ['firstName', 'lastName', 'photo'] },
                { model: db.ServiceBlock, as: 'blocks' },
                { 
                    model: db.SermonMessage, 
                    as: 'sermon',
                    include: [{ model: db.User, as: 'preacher', attributes: ['firstName', 'lastName', 'photo'] }]
                }
            ],
            order: [[{ model: db.ServiceBlock, as: 'blocks' }, 'orderIndex', 'ASC']]
        });

        if (!service) return res.status(404).json({ message: "Culte non trouvé." });
        res.json(service);
    } catch (err) {
        console.error("Get Service Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await db.WorshipService.findOne({ where: { id, churchId: req.church.id } });
        if (!service) return res.status(404).json({ message: "Culte non trouvé." });

        await service.update(req.body);
        res.json({ message: "Culte mis à jour.", service });
    } catch (err) {
        console.error("Update Service Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await db.WorshipService.findOne({ where: { id, churchId: req.church.id } });
        if (!service) return res.status(404).json({ message: "Culte non trouvé." });

        await service.destroy();
        res.json({ message: "Culte supprimé." });
    } catch (err) {
        console.error("Delete Service Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// --- Block Management ---

exports.addBlock = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { type, label, metadata, orderIndex } = req.body;

        const service = await db.WorshipService.findOne({ where: { id: serviceId, churchId: req.church.id } });
        if (!service) return res.status(404).json({ message: "Culte non trouvé." });

        const block = await db.ServiceBlock.create({
            worshipServiceId: serviceId,
            type,
            label,
            metadata,
            orderIndex: orderIndex || 0
        });

        res.status(201).json({ message: "Bloc ajouté.", block });
    } catch (err) {
        console.error("Add Block Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.updateBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const block = await db.ServiceBlock.findByPk(id);
        if (!block) return res.status(404).json({ message: "Bloc non trouvé." });

        await block.update(req.body);
        res.json({ message: "Bloc mis à jour.", block });
    } catch (err) {
        console.error("Update Block Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.deleteBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const block = await db.ServiceBlock.findByPk(id);
        if (!block) return res.status(404).json({ message: "Bloc non trouvé." });

        await block.destroy();
        res.json({ message: "Bloc supprimé." });
    } catch (err) {
        console.error("Delete Block Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.reorderBlocks = async (req, res) => {
    try {
        const { blocks } = req.body; // Array of { id, orderIndex }
        if (!Array.isArray(blocks)) return res.status(400).json({ message: "Format invalide." });

        await Promise.all(blocks.map(b => 
            db.ServiceBlock.update({ orderIndex: b.orderIndex }, { where: { id: b.id } })
        ));

        res.json({ message: "Ordre mis à jour." });
    } catch (err) {
        console.error("Reorder Blocks Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// --- Sermon Message Management ---

exports.upsertSermon = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { preacherId, title, content, points, attachments } = req.body;

        const service = await db.WorshipService.findOne({ where: { id: serviceId, churchId: req.church.id } });
        if (!service) return res.status(404).json({ message: "Culte non trouvé." });

        const [sermon, created] = await db.SermonMessage.findOrCreate({
            where: { worshipServiceId: serviceId },
            defaults: { 
                preacherId: preacherId || service.leaderId || null, 
                title: title || 'Message sans titre', 
                content, 
                points, 
                attachments 
            }
        });

        if (!created) {
            await sermon.update({ 
                preacherId: preacherId || sermon.preacherId || service.leaderId, 
                title: title || sermon.title, 
                content, 
                points, 
                attachments 
            });
        }

        res.json({ message: "Message enregistré.", sermon });
    } catch (err) {
        console.error("Upsert Sermon Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// --- Song Management ---

exports.getSongs = async (req, res) => {
    try {
        const songs = await db.Song.findAll({ where: { churchId: req.church.id } });
        res.json(songs);
    } catch (err) {
        console.error("Get Songs Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.addSong = async (req, res) => {
    try {
        const song = await db.Song.create({ ...req.body, churchId: req.church.id });
        res.status(201).json({ message: "Chant ajouté à la bibliothèque.", song });
    } catch (err) {
        console.error("Add Song Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// --- Comment & Collaborative Features ---

exports.addComment = async (req, res) => {
    try {
        const { sermonMessageId } = req.body;
        const { content, parentId, highlightRange } = req.body;

        const comment = await db.MessageComment.create({
            sermonMessageId,
            authorId: req.user.id,
            content,
            parentId,
            highlightRange
        });

        res.status(201).json({ message: "Commentaire ajouté.", comment });
    } catch (err) {
        console.error("Add Comment Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.getComments = async (req, res) => {
    try {
        const { messageId } = req.params;
        const comments = await db.MessageComment.findAll({
            where: { sermonMessageId: messageId },
            include: [{ model: db.User, as: 'author', attributes: ['firstName', 'lastName', 'photo'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(comments);
    } catch (err) {
        console.error("Get Comments Error:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier fourni." });
        }
        res.json({ url: `/uploads/${req.file.filename}` });
    } catch (err) {
        console.error("Upload Media Error:", err);
        res.status(500).json({ message: "Erreur lors du téléchargement.", error: err.message });
    }
};

const axios = require('axios');
exports.getBiblePassage = async (req, res) => {
    try {
        const { passage, version } = req.query;
        if (!passage) return res.status(400).json({ message: "Passage manquant." });

        // Parse reference (e.g., "Jean 3:16" or "Jean 3")
        // We need the Book Code (e.g. JHN), Chapter, and Verse
        // For now, let's keep it simple: if the user passes a book like "Jean", we map it to "JHN"
        const bibleTools = require('../utils/bibleTools'); // I will create this
        const { bookCode, chapter, verses } = bibleTools.parseReference(passage);

        if (!bookCode) return res.status(400).json({ message: "Livre non reconnu." });

        const url = `https://api.getbible.net/v2/${version || 'ls1910'}/${bookCode}/${chapter}.json`;
        console.log("Fetching Bible from:", url);
        
        const response = await axios.get(url);
        const data = response.data;

        // If verses were specified (e.g. 16, or 10-23), filter the results
        let finalVerses = data.verses || [];
        if (verses && verses.length > 0) {
            finalVerses = finalVerses.filter(v => verses.includes(parseInt(v.verse)));
        }

        res.json({
            reference: `${data.book_name} ${data.chapter}`,
            verses: finalVerses.map(v => ({ verse: v.verse, text: v.text }))
        });
    } catch (err) {
        console.error("Bible Proxy Error:", err.message);
        res.status(500).json({ message: "Erreur lors de la récupération du passage." });
    }
};
