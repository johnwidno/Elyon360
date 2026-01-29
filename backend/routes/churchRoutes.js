const express = require('express');
const router = express.Router();
const churchController = require('../controllers/churchController');
const { protect, hasPermission } = require('../middleware/authGuard');

const upload = require('../middleware/uploadMiddleware');

// All church settings routes are protected
router.get('/settings', protect, hasPermission('settings'), churchController.getChurchSettings);
router.put('/settings', protect, hasPermission('settings'), churchController.updateChurchSettings);
// Custom handler for uploads to catch specific Multer errors (like size limit)
router.post('/upload-image', protect, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "Le fichier est trop lourd (Max 5MB)." });
            }
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, churchController.uploadImage);
router.get('/dashboard-stats', protect, churchController.getDashboardStats);

module.exports = router;
