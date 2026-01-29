const express = require('express');
const router = express.Router();
const bankAccountController = require('../controllers/bankAccountController');
const authMiddleware = require('../middleware/authGuard');

// Toujours vérifier l'authentification
router.use(authMiddleware.protect);

// CRUD
router.post('/', bankAccountController.create);
router.get('/', bankAccountController.findAll);
router.put('/:id', bankAccountController.update);
router.delete('/:id', bankAccountController.delete);

// Deposit Action
router.post('/deposit', bankAccountController.deposit);

module.exports = router;
