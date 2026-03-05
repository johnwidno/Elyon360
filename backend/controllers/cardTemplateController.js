const { CardTemplate, MemberCard, User } = require('../models');

exports.getTemplates = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const templates = await CardTemplate.findAll({ where: { churchId } });
        res.json(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des templates." });
    }
};

exports.getTemplateById = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const template = await CardTemplate.findOne({ where: { id: req.params.id, churchId } });
        if (!template) return res.status(404).json({ message: "Template non trouvé." });
        res.json(template);
    } catch (error) {
        console.error("Error fetching template:", error);
        res.status(500).json({ message: "Erreur lors de la récupération du template." });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const { name, frontBackgroundUrl, backBackgroundUrl, layoutConfig, isActive } = req.body;

        if (isActive) {
            // Deactivate others if this one is active
            await CardTemplate.update({ isActive: false }, { where: { churchId } });
        }

        const template = await CardTemplate.create({
            churchId,
            name,
            frontBackgroundUrl,
            backBackgroundUrl,
            layoutConfig,
            isActive
        });

        res.status(201).json(template);
    } catch (error) {
        console.error("Error creating template:", error);
        res.status(500).json({ message: "Erreur lors de la création du template." });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const { name, frontBackgroundUrl, backBackgroundUrl, layoutConfig, isActive } = req.body;

        const template = await CardTemplate.findOne({ where: { id: req.params.id, churchId } });
        if (!template) return res.status(404).json({ message: "Template non trouvé." });

        if (isActive && !template.isActive) {
            await CardTemplate.update({ isActive: false }, { where: { churchId } });
        }

        await template.update({
            name,
            frontBackgroundUrl,
            backBackgroundUrl,
            layoutConfig,
            isActive
        });

        res.json(template);
    } catch (error) {
        console.error("Error updating template:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du template." });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const template = await CardTemplate.findOne({ where: { id: req.params.id, churchId } });
        if (!template) return res.status(404).json({ message: "Template non trouvé." });

        await template.destroy();
        res.json({ message: "Template supprimé avec succès." });
    } catch (error) {
        console.error("Error deleting template:", error);
        res.status(500).json({ message: "Erreur lors de la suppression." });
    }
};
