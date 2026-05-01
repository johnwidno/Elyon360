const express = require('express');
const router = express.Router();
const communityPostController = require('../controllers/communityPostController');
const { protect } = require('../middleware/authGuard');

const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, communityPostController.getPosts);
router.post('/', protect, upload.single('image'), communityPostController.createPost);
router.put('/:id', protect, upload.single('image'), communityPostController.updatePost);
router.delete('/:id', protect, communityPostController.deletePost);
router.get('/user/:userId', protect, communityPostController.getPostsByUser);

module.exports = router;
