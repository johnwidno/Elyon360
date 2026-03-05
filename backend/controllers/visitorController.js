const db = require('../models');
const { Op } = require('sequelize');

// Create a new visitor (Public Site)
exports.registerVisitor = async (req, res) => {
    try {
        const { churchId, firstName, lastName, email, phone, description, wantsMembership } = req.body;

        const visitor = await db.Visitor.create({
            churchId,
            firstName,
            lastName,
            email,
            phone,
            description,
            wantsMembership: wantsMembership || false,
            status: 'new',
            viewStatus: 'not_viewed'
        });

        res.status(201).json({ message: "Inscription réussie !", visitor });
    } catch (error) {
        console.error("Visitor Registration Error:", error);
        res.status(500).json({ message: "Erreur lors de l'inscription." });
    }
};

// Create a new visitor (Admin Site)
exports.createVisitor = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, description, wantsMembership, notes } = req.body;

        const visitor = await db.Visitor.create({
            churchId: req.church.id,
            firstName,
            lastName,
            email,
            phone,
            description,
            wantsMembership: wantsMembership || false,
            notes,
            status: 'new',
            viewStatus: 'not_viewed'
        });

        res.status(201).json(visitor);
    } catch (error) {
        console.error("Visitor Creation Error:", error);
        res.status(500).json({ message: "Erreur lors de la création du visiteur." });
    }
};

// Get all visitors with search and date filtering (Admin)
exports.getAllVisitors = async (req, res) => {
    try {
        const { search, startDate, endDate } = req.query;

        const whereClause = { churchId: req.church.id };

        // Search filter
        if (search) {
            whereClause[Op.or] = [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } }
            ];
        }

        // Date range filter
        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereClause.createdAt = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.createdAt = {
                [Op.lte]: new Date(endDate)
            };
        }

        const visitors = await db.Visitor.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        res.json(visitors);
    } catch (error) {
        console.error("Get Visitors Error:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Update visitor status
exports.updateVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        await db.Visitor.update(req.body, {
            where: { id, churchId: req.church.id }
        });
        res.json({ message: "Visiteur mis à jour" });
    } catch (error) {
        console.error("Update Visitor Error:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
};

// Update visitor view status
exports.updateViewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { viewStatus } = req.body;

        await db.Visitor.update(
            { viewStatus },
            { where: { id, churchId: req.church.id } }
        );

        res.json({ message: "Statut de vue mis à jour" });
    } catch (error) {
        console.error("Update View Status Error:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
};

// Convert visitor to member
exports.convertToMember = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;

        // Find the visitor
        const visitor = await db.Visitor.findOne({
            where: { id, churchId: req.church.id }
        });

        if (!visitor) {
            await transaction.rollback();
            return res.status(404).json({ message: "Visiteur non trouvé" });
        }

        // Check if already converted
        if (visitor.convertedToMemberId) {
            await transaction.rollback();
            return res.status(400).json({ message: "Ce visiteur a déjà été converti en membre" });
        }

        // Check if email already exists in users
        const existingUser = await db.User.findOne({
            where: {
                email: visitor.email,
                churchId: req.church.id
            }
        });

        if (existingUser) {
            await transaction.rollback();
            return res.status(409).json({ message: "Un membre avec cet email existe déjà" });
        }

        // Create new member (User)
        const newMember = await db.User.create({
            churchId: req.church.id,
            firstName: visitor.firstName,
            lastName: visitor.lastName,
            email: visitor.email,
            phone: visitor.phone,
            password: '$2a$10$temporary.password.hash', // Temporary - user should reset
            role: JSON.stringify(['member']),
            baptismalStatus: 'not_baptized',
            subtypeId: null
        }, { transaction });

        // Update visitor record
        await visitor.update({
            convertedToMemberId: newMember.id,
            status: 'integrated',
            viewStatus: 'viewed'
        }, { transaction });

        await transaction.commit();

        res.json({
            message: "Visiteur converti en membre avec succès",
            member: newMember
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Convert to Member Error:", error);
        res.status(500).json({ message: "Erreur lors de la conversion" });
    }
};

// Delete visitor
exports.deleteVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        await db.Visitor.destroy({
            where: { id, churchId: req.church.id }
        });
        res.json({ message: "Visiteur supprimé" });
    } catch (error) {
        console.error("Delete Visitor Error:", error);
        res.status(500).json({ message: "Erreur lors de la suppression" });
    }
};
