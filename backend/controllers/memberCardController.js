const { MemberCard, User } = require('../models');

// Fetch SELF member cards (for member portal)
exports.getMyCards = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const userId = req.user.id;

        const cards = await MemberCard.findAll({
            where: { churchId, userId },
            order: [['issueDate', 'DESC']]
        });

        console.log(`[getMyCards] user=${userId}, church=${churchId}, found=${cards.length} cards`);
        res.json(cards);
    } catch (error) {
        console.error("Get MyCards Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération de vos cartes." });
    }
};

// Fetch user member cards
exports.getMemberCards = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const { userId } = req.params;

        const cards = await MemberCard.findAll({
            where: { churchId, userId },
            order: [['issueDate', 'DESC']]
        });

        res.json(cards);
    } catch (error) {
        console.error("Get MemberCards Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des cartes." });
    }
};

// Add a member card
exports.addMemberCard = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        let { userId, cardNumber, issueDate, status, description, templateId } = req.body;

        // Ensure templateId is an actual integer (db constraint)
        if (templateId && templateId.toString().startsWith('tpl_')) {
            templateId = null;
        }

        const newCard = await MemberCard.create({
            churchId,
            userId,
            cardNumber,
            issueDate,
            status,
            description,
            templateId
        });

        res.status(201).json(newCard);
    } catch (error) {
        console.error("Add MemberCard Error:", error);
        res.status(500).json({ message: "Erreur lors de l'ajout de la carte.", error: error.message });
    }
};

// Edit a member card
exports.editMemberCard = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const { id } = req.params;
        let { cardNumber, issueDate, status, description, templateId } = req.body;

        const card = await MemberCard.findOne({ where: { id, churchId } });
        if (!card) {
            return res.status(404).json({ message: "Carte non trouvée." });
        }

        if (templateId && templateId.toString().startsWith('tpl_')) {
            templateId = null;
        }

        await card.update({ cardNumber, issueDate, status, description, templateId });

        res.json(card);
    } catch (error) {
        console.error("Edit MemberCard Error:", error);
        res.status(500).json({ message: "Erreur lors de la modification de la carte.", error: error.message });
    }
};

// Delete a member card
exports.deleteMemberCard = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const { id } = req.params;

        await MemberCard.destroy({ where: { id, churchId } });
        res.json({ message: "Carte supprimée avec succès." });
    } catch (error) {
        console.error("Delete MemberCard Error:", error);
        res.status(500).json({ message: "Erreur lors de la suppression de la carte." });
    }
};
