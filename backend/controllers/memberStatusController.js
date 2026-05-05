const { MemberStatus, User, Church } = require('../models');
const { Op } = require('sequelize');

exports.createStatus = async (req, res) => {
    try {
        const { type, content, imageUrl, styleConfig } = req.body;
        const adminId = req.user.id;
        const churchId = req.user.churchId;

        // Set expiration to 24 hours from now
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const status = await MemberStatus.create({
            type,
            content,
            imageUrl,
            styleConfig,
            adminId,
            churchId,
            expiresAt
        });

        res.status(201).json(status);
    } catch (error) {
        console.error('CRITICAL ERROR creating status:', error);
        res.status(500).json({ 
            message: 'Error creating status', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        });
    }
};

exports.getStatuses = async (req, res) => {
    try {
        const churchId = req.user.churchId;
        const now = new Date();

        const statuses = await MemberStatus.findAll({
            where: { churchId },
            order: [['createdAt', 'DESC']]
        });

        res.json(statuses);
    } catch (error) {
        console.error('CRITICAL ERROR fetching statuses:', error);
        res.status(500).json({ 
            message: 'Error fetching statuses', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.deleteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.user.churchId;

        const status = await MemberStatus.findOne({ where: { id, churchId } });
        if (!status) {
            return res.status(404).json({ message: 'Status not found' });
        }

        // Only the creator or a super admin can delete? 
        // For now, let's allow any admin of the church to delete statuses.
        await status.destroy();
        res.json({ message: 'Status deleted successfully' });
    } catch (error) {
        console.error('Error deleting status:', error);
        res.status(500).json({ message: 'Error deleting status' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, content, imageUrl, styleConfig } = req.body;
        const churchId = req.user.churchId;

        const status = await MemberStatus.findOne({ where: { id, churchId } });
        if (!status) {
            return res.status(404).json({ message: 'Status not found' });
        }

        status.type = type || status.type;
        status.content = content || status.content;
        status.imageUrl = imageUrl !== undefined ? imageUrl : status.imageUrl;
        status.styleConfig = styleConfig || status.styleConfig;

        await status.save();
        res.json(status);
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Error updating status' });
    }
};
