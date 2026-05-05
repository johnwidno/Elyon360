const express = require('express');
const router = express.Router();
const memberStatusController = require('../controllers/memberStatusController');
const { protect, authorize } = require('../middleware/authGuard');
const upload = require('../middleware/uploadMiddleware');

console.log('[Debug] MemberStatusRoutes initialized');

// Test route to verify 404 issue
router.get('/ping', (req, res) => res.json({ message: 'Statuses API is alive' }));

// Get active statuses (Accessible by all logged in members)
router.get('/', protect, memberStatusController.getStatuses);

// Create status (Admin only)
router.post('/', protect, authorize('admin'), memberStatusController.createStatus);

// Upload image (Admin only - Temporairement ouvert pour debug)
router.post('/upload', (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof require('multer').MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Le fichier est trop volumineux. Maximum 10Mo.' });
            }
            console.error(`[Multer Error] ${err.code}: ${err.message}`);
            return res.status(400).json({ message: `Erreur d'upload: ${err.message}` });
        } else if (err) {
            console.error(`[Upload Error] ${err.message}`);
            return res.status(400).json({ message: err.message });
        }
        
        if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu' });
        res.json({ imageUrl: `/uploads/${req.file.filename}` });
    });
});

// Delete status (Admin only)
router.delete('/:id', protect, authorize('admin'), memberStatusController.deleteStatus);

// Update status (Admin only)
router.put('/:id', protect, authorize('admin'), memberStatusController.updateStatus);

router.get('/db-check', async (req, res) => {
    try {
        const count = await MemberStatus.count();
        res.json({ tableExists: true, count });
    } catch (error) {
        res.status(500).json({ tableExists: false, error: error.message });
    }
});

module.exports = router;
