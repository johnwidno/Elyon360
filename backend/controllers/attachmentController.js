const db = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads', 'attachments');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Format de fichier non supporté.'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('file');

// Create Attachment
exports.addAttachment = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            const { userId, name, type, url } = req.body;

            let attachmentData = {
                userId,
                name: name || (req.file ? req.file.originalname : 'Sans titre'),
                type: type || 'file'
            };

            if (attachmentData.type === 'file' && req.file) {
                attachmentData.url = `/uploads/attachments/${req.file.filename}`;
                attachmentData.fileType = path.extname(req.file.originalname).replace('.', '');
                attachmentData.size = req.file.size;
            } else if (attachmentData.type === 'link') {
                attachmentData.url = url;
                attachmentData.fileType = 'link';
            } else {
                return res.status(400).json({ message: "Données d'attachement invalides." });
            }

            const newAttachment = await db.Attachment.create(attachmentData);
            res.status(201).json(newAttachment);
        } catch (error) {
            console.error("Add Attachment Error:", error);
            res.status(500).json({ message: "Erreur lors de l'ajout de l'attachement." });
        }
    });
};

// Get All Attachments for a User
exports.getAttachments = async (req, res) => {
    try {
        const { userId } = req.params;

        if (isNaN(userId)) {
            return res.status(400).json({ message: "ID utilisateur invalide." });
        }

        const attachments = await db.Attachment.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        res.json(attachments);
    } catch (error) {
        console.error("Get Attachments Error:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des attachements." });
    }
};

// Delete Attachment
exports.deleteAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const attachment = await db.Attachment.findByPk(id);

        if (!attachment) {
            return res.status(404).json({ message: "Attachement non trouvé." });
        }

        // If it's a file, delete it from the server
        if (attachment.type === 'file' && attachment.url.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', attachment.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await attachment.destroy();
        res.json({ message: "Attachement supprimé avec succès." });
    } catch (error) {
        console.error("Delete Attachment Error:", error);
        res.status(500).json({ message: "Erreur lors de la suppression." });
    }
};
