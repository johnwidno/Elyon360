const express = require('express');
const router = express.Router();
const searchBuilderController = require('../controllers/searchBuilderController');
const { protect } = require('../middleware/authGuard');

router.get('/tables', protect, searchBuilderController.getAvailableTables);
router.get('/columns/:tableId', protect, searchBuilderController.getTableColumns);
router.post('/execute', protect, searchBuilderController.executeSearch);
router.post('/export', protect, searchBuilderController.exportResults);

router.post('/saved', protect, searchBuilderController.saveSearch);
router.get('/saved', protect, searchBuilderController.getSavedSearches);
router.delete('/saved/:id', protect, searchBuilderController.deleteSavedSearch);

router.get('/field-values/:field', protect, searchBuilderController.getFilterValues);

module.exports = router;
