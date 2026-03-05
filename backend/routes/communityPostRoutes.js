const express = require('express');
const router = express.Router();
const communityPostController = require('../controllers/communityPostController');
const { protect } = require('../middleware/authGuard');

router.get('/', protect, communityPostController.getPosts);
router.post('/', protect, communityPostController.createPost);
router.put('/:id', protect, communityPostController.updatePost);
router.delete('/:id', protect, communityPostController.deletePost);

module.exports = router;
