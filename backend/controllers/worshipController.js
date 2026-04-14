const db = require('../models');
const axios = require('axios');

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

exports.getBiblePassage = async (req, res) => {
    try {
        const { passage, version } = req.query;
        if (!passage) return res.status(400).json({ message: "Passage manquant." });

        // Parse reference (e.g., "Jean 3:16" or "Jean 3")
        // We need the Book Code (e.g. JHN), Chapter, and Verse
        // For now, let's keep it simple: if the user passes a book like "Jean", we map it to "JHN"
        const bibleTools = require('../utils/bibleTools');
        const { bookCode, chapter, verses } = bibleTools.parseReference(passage);

        if (!bookCode) return res.status(400).json({ message: "Livre non reconnu." });

        const currentVersion = version || 'ls1910';
        console.log(`Searching Bible: ${passage} | Version: ${currentVersion}`);

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
        };

        const bookIdToName = {
            '1': 'Genesis', '2': 'Exodus', '3': 'Leviticus', '4': 'Numbers', '5': 'Deuteronomy',
            '6': 'Joshua', '7': 'Judges', '8': 'Ruth', '9': '1 Samuel', '10': '2 Samuel',
            '11': '1 Kings', '12': '2 Kings', '13': '1 Chronicles', '14': '2 Chronicles', '15': 'Ezra',
            '16': 'Nehemiah', '17': 'Esther', '18': 'Job', '19': 'Psalms', '20': 'Proverbs',
            '21': 'Ecclesiastes', '22': 'Song of Solomon', '23': 'Isaiah', '24': 'Jeremiah', '25': 'Lamentations',
            '26': 'Ezekiel', '27': 'Daniel', '28': 'Hosea', '29': 'Joel', '30': 'Amos',
            '31': 'Obadiah', '32': 'Jonah', '33': 'Micah', '34': 'Nahum', '35': 'Habakkuk',
            '36': 'Zephaniah', '37': 'Haggai', '38': 'Zechariah', '39': 'Malachi',
            '40': 'Matthew', '41': 'Mark', '42': 'Luke', '43': 'John', '44': 'Acts',
            '45': 'Romans', '46': '1 Corinthians', '47': '2 Corinthians', '48': 'Galatians', '49': 'Ephesians',
            '50': 'Philippians', '51': 'Colossians', '52': '1 Thessalonians', '53': '2 Thessalonians', '54': '1 Timothy',
            '55': '2 Timothy', '56': 'Titus', '57': 'Philemon', '58': 'Hebrews', '59': 'James',
            '60': '1 Peter', '61': '2 Peter', '62': '1 John', '63': '2 John', '64': '3 John',
            '65': 'Jude', '66': 'Revelation'
        };

        // Map our internal version codes to BibleGateway codes
        const versionMap = {
            'hcv': 'HCV',      // Haitian Creole
            'ls1910': 'LSG',   // Louis Segond 1910
            'neg1979': 'NEG1979', // Nouvelle Edition de Genève
            'kjv': 'KJV'       // King James Version
        };
        const targetVersion = versionMap[currentVersion] || 'LSG';

        try {
            const cheerio = require('cheerio');
            
            // Construct standard reference for BibleGateway
            // BibleGateway is very smart and usually accepts English names even for French bibles
            let gatewayRef = `${bookIdToName[bookCode]} ${chapter}`;
            const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(gatewayRef)}&version=${targetVersion}`;
            
            console.log(`Scraping BibleGateway: ${url}`);
            
            const response = await axios.get(url, { headers });
            const $ = cheerio.load(response.data);
            let rawVerses = [];

            // More robust selector: BibleGateway verses always have a class containing the verse number
            // and are usually within a .text class div or span
            $('[class*="-text"]').each((i, el) => {
                const fullClass = $(el).attr('class');
                if (!fullClass) return;

                // Match formats like "text Gen-1-1", "text lsg-v1", etc.
                // We look for the last set of digits in classes that look like verse identifiers
                const parts = fullClass.split(' ');
                let verseNum = null;

                for (const cls of parts) {
                    // Look for patterns like "v1", "verse-1", "Gen-1-1"
                    const m = cls.match(/-(\d+)$/) || cls.match(/v(\d+)$/);
                    if (m) {
                        verseNum = parseInt(m[1]);
                        break;
                    }
                }

                if (verseNum === null) {
                    // Fallback to searching for .versenum inside or nearby if scraper is failing
                    const numEl = $(el).find('.versenum');
                    if (numEl.length > 0) {
                        verseNum = parseInt(numEl.text().trim());
                    }
                }

                // Clone element and remove non-verse text (footnotes, crossrefs)
                const clone = $(el).clone();
                clone.find('sup, .chapternum, .versenum, .crossreference, .footnote').remove();
                
                let textContent = clone.text().replace(/\u00A0/g, ' ').replace(/¶/g, '').trim();
                textContent = textContent.replace(/^\d+/, '').trim();

                if (textContent && verseNum !== null && !Number.isNaN(verseNum)) {
                    rawVerses.push({ verse: verseNum, text: textContent });
                }
            });

            // Merge same verse chunks (Biblegateway often splits the same verse into multiple spans)
            const mergedVerses = [];
            for (let v of rawVerses) {
                const existing = mergedVerses.find(m => m.verse === v.verse);
                if (existing) {
                    // Only append if it's not exactly the same text (sometimes BG duplicates content in hidden spans)
                    if (!existing.text.includes(v.text)) {
                        existing.text += " " + v.text;
                    }
                } else {
                    mergedVerses.push({ ...v });
                }
            }

            if (mergedVerses.length > 0) {
                let finalVerses = mergedVerses;
                if (verses && verses.length > 0) {
                    finalVerses = finalVerses.filter(v => verses.includes(v.verse));
                }

                return res.json({
                    reference: `${passage.split(':')[0]}`,
                    verses: finalVerses
                });
            }
            
            // If the robust scraper fails, try a fallback: search for anything inside .passage-text
            console.log("BibleGateway primary scraper failed, trying fallback...");
            let fallbackText = '';
            $('.passage-content').each((i, el) => {
                const clone = $(el).clone();
                clone.find('sup, .chapternum, .versenum, .crossreference, .footnote').remove();
                fallbackText += clone.text().replace(/\u00A0/g, ' ').replace(/¶/g, '').trim() + " ";
            });

            if (fallbackText.trim()) {
                return res.json({
                    reference: passage,
                    verses: [{ verse: 1, text: fallbackText.trim() }] // Simplified result
                });
            }
            
            throw new Error("No verses extracted from BibleGateway for: " + gatewayRef);
        } catch (e) {
            console.error("Bible Scraper Error:", e.stack || e);
            return res.status(500).json({ message: "Erreur lors de la récupération du passage avec cette version." });
        }
    } catch (err) {
        console.error("Bible Proxy Error:", err.stack || err);
        res.status(500).json({ message: "Erreur serveur inattendue." });
    }
};
