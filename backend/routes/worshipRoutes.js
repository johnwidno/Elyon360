const express = require('express');
const router = express.Router();
const worshipController = require('../controllers/worshipController');
const authGuard = require('../middleware/authGuard');

// Public route for projection sharing (no auth required)
router.get('/public/:id', worshipController.getServiceById);

// All other routes require authentication
router.use(authGuard.protect);

// --- Worship Services ---
router.post('/', worshipController.createService);
router.get('/', worshipController.getServices);
router.get('/:id', worshipController.getServiceById);
router.put('/:id', worshipController.updateService);
router.delete('/:id', worshipController.deleteService);

// --- Service Blocks ---
router.post('/:serviceId/blocks', worshipController.addBlock);
router.put('/blocks/reorder', worshipController.reorderBlocks);
router.put('/blocks/:id', worshipController.updateBlock);
router.delete('/blocks/:id', worshipController.deleteBlock);

// --- Media Upload (Image/Video) ---
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'worship-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadMedia = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|mp4|webm|avi|mov/;
        if (allowedTypes.test(path.extname(file.originalname).toLowerCase()) || allowedTypes.test(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format non supporté (images ou vidéos uniquement).'));
        }
    }
});

router.post('/upload', uploadMedia.single('media'), worshipController.uploadMedia);

// --- Sermon Message ---
router.post('/:serviceId/sermon', worshipController.upsertSermon);

// --- Songs ---
router.get('/songs/library', worshipController.getSongs);
router.post('/songs', worshipController.addSong);

// --- Comments ---
router.post('/comments', worshipController.addComment);
router.get('/comments/:messageId', worshipController.getComments);

// --- Bible Proxy ---
router.get('/bible/proxy', worshipController.getBiblePassage);

module.exports = router;
