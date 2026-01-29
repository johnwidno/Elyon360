const express = require('express');
const router = express.Router();
const typeController = require('../controllers/contactTypeController');
const subtypeController = require('../controllers/contactSubtypeController');
const { protect, hasPermission } = require('../middleware/authGuard');

router.use(protect);

// Types
router.get('/types', typeController.getAllTypes);
router.post('/types', hasPermission('settings'), typeController.createType);
router.put('/types/:id', hasPermission('settings'), typeController.updateType);
router.delete('/types/:id', hasPermission('settings'), typeController.deleteType);

// Subtypes
router.get('/subtypes', subtypeController.getAllSubtypes);
router.post('/subtypes', hasPermission('settings'), subtypeController.createSubtype);
router.put('/subtypes/:id', hasPermission('settings'), subtypeController.updateSubtype);
router.delete('/subtypes/:id', hasPermission('settings'), subtypeController.deleteSubtype);

module.exports = router;
