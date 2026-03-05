const db = require('../models');
const { Op } = require('sequelize');

// Helper to create notification
const createNotification = async (userId, churchId, title, message, type = 'request') => {
    try {
        await db.Notification.create({
            userId,
            churchId,
            title,
            message,
            type,
            isRead: false
        });
    } catch (error) {
        console.error("Notification Error:", error);
    }
};

// POST /api/member-requests
exports.createRequest = async (req, res) => {
    try {
        const { title, requestType, description, internalNote } = req.body;
        const userId = req.user.id;
        const churchId = req.user.churchId;

        if (!title || !requestType || !description) {
            return res.status(400).json({ message: "Veuillez remplir tous les champs obligatoires." });
        }

        const request = await db.MemberRequest.create({
            userId,
            churchId,
            title,
            requestType,
            description,
            internalNote,
            status: 'non vue'
        });

        // Notify admins of the church
        const admins = await db.User.findAll({
            where: {
                churchId,
                [Op.or]: [
                    { role: { [Op.iLike]: '%admin%' } },
                    { role: { [Op.iLike]: '%super_admin%' } }
                ]
            }
        });

        for (const admin of admins) {
            await createNotification(
                admin.id,
                churchId,
                "Nouvelle demande de membre",
                `Un membre a soumis une demande : ${title}`
            );
        }

        res.status(201).json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la création de la demande." });
    }
};

// GET /api/member-requests
exports.getRequests = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const { type, status, startDate, endDate, search, page = 1, limit = 10 } = req.query;

        const where = { churchId };

        // Authorization: members only see their own
        const isAdmin = req.user.role.some(r => ['admin', 'super_admin', 'superaduser', 'Staff', 'secretaire', 'secretaire_adjoint', 'pasteur', 'responsable'].includes(r) || r.includes('admin'));
        if (!isAdmin) {
            where.userId = req.user.id;
        }

        if (type) where.requestType = type;
        if (status) where.status = status;
        if (startDate && endDate) {
            where.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        if (search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
                { '$member.firstName$': { [Op.iLike]: `%${search}%` } },
                { '$member.lastName$': { [Op.iLike]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await db.MemberRequest.findAndCountAll({
            where,
            include: [
                { model: db.User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'phone', 'email'] },
                { model: db.User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName'] },
                {
                    model: db.MemberRequestHistory,
                    as: 'history',
                    include: [{ model: db.User, as: 'changedBy', attributes: ['firstName', 'lastName'] }]
                }
            ],
            order: [
                ['createdAt', 'DESC'],
                [{ model: db.MemberRequestHistory, as: 'history' }, 'createdAt', 'DESC']
            ],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            data: rows,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des demandes." });
    }
};

// GET /api/member-requests/:id
exports.getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const where = { id, churchId: req.user.churchId };

        const isAdmin = req.user.role.some(r => ['admin', 'super_admin', 'superaduser', 'Staff', 'secretaire', 'secretaire_adjoint', 'pasteur', 'responsable'].includes(r) || r.includes('admin'));
        if (!isAdmin) {
            where.userId = req.user.id;
        }

        const request = await db.MemberRequest.findOne({
            where,
            include: [
                { model: db.User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'phone', 'email'] },
                { model: db.User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName'] },
                {
                    model: db.MemberRequestHistory,
                    as: 'history',
                    include: [{ model: db.User, as: 'changedBy', attributes: ['firstName', 'lastName'] }]
                }
            ],
            order: [
                [{ model: db.MemberRequestHistory, as: 'history' }, 'createdAt', 'DESC']
            ]
        });

        if (!request) {
            return res.status(404).json({ message: "Demande non trouvée." });
        }

        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// PATCH /api/member-requests/:id
exports.updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, internalNote, assignedToId, description } = req.body;
        const isAdmin = req.user.role.some(r => ['admin', 'super_admin', 'superaduser', 'Staff', 'secretaire', 'secretaire_adjoint', 'pasteur', 'responsable'].includes(r) || r.includes('admin'));

        const request = await db.MemberRequest.findOne({
            where: { id, churchId: req.user.churchId }
        });

        if (!request) {
            return res.status(404).json({ message: "Demande non trouvée." });
        }

        // Authorization
        if (!isAdmin && request.userId !== req.user.id) {
            return res.status(403).json({ message: "Non autorisé." });
        }

        const updateData = {};
        if (isAdmin) {
            if (status) {
                const oldStatus = request.status;
                updateData.status = status;
                updateData.statusUpdateDate = new Date();

                // Notify member if status changed
                if (oldStatus !== status) {
                    await createNotification(
                        request.userId,
                        request.churchId,
                        "Mise à jour de votre demande",
                        `Le statut de votre demande "${request.title}" est passé à : ${status}`
                    );
                }

                // Log history
                await db.MemberRequestHistory.create({
                    requestId: id,
                    oldStatus: oldStatus,
                    newStatus: status,
                    changedById: req.user.id,
                    note: internalNote || `Statut mis à jour : ${status}`
                });
            } else if (internalNote !== undefined && internalNote !== request.internalNote) {
                // Log internal note change if status didn't change
                await db.MemberRequestHistory.create({
                    requestId: id,
                    oldStatus: request.status,
                    newStatus: request.status,
                    changedById: req.user.id,
                    note: `Note interne mise à jour : ${internalNote}`
                });
            }
            if (internalNote !== undefined) updateData.internalNote = internalNote;
            if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
        } else {
            // Member can only update description if not processed?
            if (request.status === 'non vue') {
                if (description) {
                    updateData.description = description;
                    // Log member update
                    await db.MemberRequestHistory.create({
                        requestId: id,
                        oldStatus: request.status,
                        newStatus: request.status,
                        changedById: req.user.id,
                        note: "Description mise à jour par le membre"
                    });
                }
            } else {
                return res.status(400).json({ message: "Vous ne pouvez plus modifier une demande déjà prise en compte." });
            }
        }

        await request.update(updateData);

        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la mise à jour." });
    }
};

// DELETE /api/member-requests/:id
exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await db.MemberRequest.findOne({
            where: { id, churchId: req.user.churchId }
        });

        if (!request) {
            return res.status(404).json({ message: "Demande non trouvée." });
        }

        // Only member can delete if non vue, or admin
        const isAdmin = req.user.role.some(r => ['admin', 'super_admin', 'superaduser', 'Staff', 'secretaire', 'secretaire_adjoint', 'pasteur', 'responsable'].includes(r) || r.includes('admin'));
        if (!isAdmin && (request.userId !== req.user.id || request.status !== 'non vue')) {
            return res.status(403).json({ message: "Non autorisé." });
        }

        await request.destroy();
        res.json({ message: "Demande supprimée." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la suppression." });
    }
};
