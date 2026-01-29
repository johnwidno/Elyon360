const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middleware/authGuard');

router.post('/', protect, inventoryController.addItem);
router.get('/', protect, inventoryController.getItems);
router.put('/:id', protect, inventoryController.updateItem);
router.delete('/:id', protect, inventoryController.deleteItem);

module.exports = router;
