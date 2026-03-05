const express = require('express');
const router = express.Router();
const cardTemplateController = require('../controllers/cardTemplateController');
const { protect } = require('../middleware/authGuard');

router.get('/', protect, cardTemplateController.getTemplates);
router.get('/:id', protect, cardTemplateController.getTemplateById);
router.post('/', protect, cardTemplateController.createTemplate);
router.put('/:id', protect, cardTemplateController.updateTemplate);
router.delete('/:id', protect, cardTemplateController.deleteTemplate);

module.exports = router;
