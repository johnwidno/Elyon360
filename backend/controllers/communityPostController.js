const db = require('../models');

// HELPER: Ensure associations are registered even if server didn't restart
const ensureAssociations = () => {
    if (!db.CommunityPost.associations.targetSubtype) {
        db.CommunityPost.belongsTo(db.ContactSubtype, { foreignKey: 'targetSubtypeId', as: 'targetSubtype' });
    }
    if (!db.CommunityPost.associations.author) {
        db.CommunityPost.belongsTo(db.User, { foreignKey: 'authorId', as: 'author' });
    }
    if (!db.CommunityPost.associations.church) {
        db.CommunityPost.belongsTo(db.Church, { foreignKey: 'churchId', as: 'church' });
    }
};

exports.getPosts = async (req, res) => {
    try {
        ensureAssociations();
        const userSubtypeId = req.user.subtypeId;
        const churchId = req.user.churchId;
        console.log(`[DEBUG] getPosts: user=${req.user.id}, churchId=${churchId}, subtypeId=${userSubtypeId}`);

        const posts = await db.CommunityPost.findAll({
            where: {
                [db.Sequelize.Op.or]: [
                    { isGlobal: true },
                    {
                        churchId: churchId,
                        [db.Sequelize.Op.or]: [
                            { targetSubtypeId: null },
                            { targetSubtypeId: userSubtypeId }
                        ]
                    }
                ]
            },
            include: [
                { model: db.User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'photo', 'role'] },
                { model: db.ContactSubtype, as: 'targetSubtype', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']],
        });
        console.log(`[DEBUG] getPosts: found ${posts.length} posts`);
        res.status(200).json(posts);
    } catch (error) {
        console.error('getPosts error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des posts.' });
    }
};

exports.createPost = async (req, res) => {
    try {
        ensureAssociations();
        console.log('[DEBUG] createPost: body=', req.body);
        const { title, type, content, targetSubtypeId, isGlobal } = req.body;
        let finalImageUrl = req.body.imageUrl;
        
        if (req.file) {
            finalImageUrl = `/uploads/${req.file.filename}`;
        }

        const post = await db.CommunityPost.create({
            churchId: isGlobal ? null : req.user.churchId,
            authorId: req.user.id,
            title,
            type: type || 'general',
            content,
            imageUrl: finalImageUrl,
            targetSubtypeId: (targetSubtypeId && targetSubtypeId !== '') ? targetSubtypeId : null,
            isGlobal: !!isGlobal
        });
        console.log(`[DEBUG] createPost: created post id=${post.id}`);

        // Fetch to return full author info
        const newPost = await db.CommunityPost.findByPk(post.id, {
            include: [
                { model: db.User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'photo', 'role'] },
                { model: db.ContactSubtype, as: 'targetSubtype', attributes: ['name'] }
            ]
        });

        res.status(201).json(newPost);
    } catch (error) {
        console.error('createPost error:', error);
        res.status(500).json({ message: 'Erreur lors de la création du post.', error: error.message });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await db.CommunityPost.findByPk(id);

        if (!post) {
            return res.status(404).json({ message: 'Post introuvable.' });
        }

        // Only author or admin can delete
        const isAuthor = post.authorId === req.user.id;
        const roles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        const isAdmin = roles.some(r => ['admin', 'super_admin'].includes(r));

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ message: 'Action non autorisée.' });
        }

        await post.destroy();
        res.status(200).json({ message: 'Post supprimé avec succès.' });
    } catch (error) {
        console.error('deletePost error:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du post.' });
    }
};

exports.updatePost = async (req, res) => {
    try {
        ensureAssociations();
        const { id } = req.params;
        const { title, type, content, targetSubtypeId, isGlobal } = req.body;
        let finalImageUrl = req.body.imageUrl;

        if (req.file) {
            finalImageUrl = `/uploads/${req.file.filename}`;
        }

        const post = await db.CommunityPost.findByPk(id);

        if (!post) return res.status(404).json({ message: 'Post introuvable.' });

        // Authorization
        const roles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        const isAdmin = roles.some(r => ['admin', 'super_admin'].includes(r));
        if (post.authorId !== req.user.id && !isAdmin) {
            return res.status(403).json({ message: 'Non autorisé.' });
        }

        await post.update({
            title,
            type: type || 'general',
            content,
            imageUrl: finalImageUrl,
            targetSubtypeId: targetSubtypeId || null,
            isGlobal: !!isGlobal,
            churchId: isGlobal ? null : req.user.churchId
        });

        const updated = await db.CommunityPost.findByPk(id, {
            include: [
                { model: db.User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'photo', 'role'] },
                { model: db.ContactSubtype, as: 'targetSubtype', attributes: ['name'] }
            ]
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error('updatePost error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du post.', error: error.message });
    }
};
