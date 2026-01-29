const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authGuard = require('../middleware/authGuard');

// All role routes require authentication
router.use(authGuard.protect);

router.get('/', roleController.getRoles);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;
