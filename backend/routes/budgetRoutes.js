const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { protect, hasPermission } = require('../middleware/authGuard');

router.use(protect);
router.use(hasPermission('finances'));

router.get('/', budgetController.getAllBudgets);
router.post('/', budgetController.createBudget);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
