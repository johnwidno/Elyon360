const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { protect, hasPermission } = require('../middleware/authGuard');

// Member Routes
router.get('/profile', protect, memberController.getProfile);
router.put('/profile', protect, memberController.updateProfile);

// Admin Routes (for members management)
router.post('/', protect, hasPermission('members'), memberController.createMember);
router.get('/', protect, hasPermission('members'), memberController.getAllMembers);
router.get('/:id', protect, hasPermission('members'), memberController.getMemberById);
router.put('/:id', protect, hasPermission('members'), memberController.updateMember);
router.delete('/:id', protect, hasPermission('members'), memberController.deleteMember);
router.get('/:id/history', protect, hasPermission('members'), memberController.getMemberHistory);

// Multi-item Notes
router.get('/:id/notes', protect, hasPermission('members'), memberController.getMemberNotes);
router.post('/:id/notes', protect, hasPermission('members'), memberController.createMemberNote);
router.put('/:id/notes/:noteId', protect, hasPermission('members'), memberController.updateMemberNote);
router.delete('/:id/notes/:noteId', protect, hasPermission('members'), memberController.deleteMemberNote);

// Actions
router.get('/:id/actions', protect, hasPermission('members'), memberController.getMemberActions);
router.post('/:id/actions', protect, hasPermission('members'), memberController.createMemberAction);

// Requests
router.get('/:id/requests', protect, hasPermission('members'), memberController.getMemberRequests);

module.exports = router;
