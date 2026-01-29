const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect, hasPermission } = require('../middleware/authGuard');

router.use(protect);
router.use(hasPermission('finances'));

router.get('/', expenseController.getAllExpenses);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
