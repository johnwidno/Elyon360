const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { protect, hasPermission } = require('../middleware/authGuard');

// ── Specific literal routes FIRST (before /:id) ────────────────────────────

const upload = require('../middleware/uploadMiddleware');
// Own profile (authenticated user)
router.get('/profile', protect, memberController.getProfile);
router.put('/profile', protect, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'coverPic', maxCount: 1 }]), memberController.updateProfile);

// Community: accessible to all authenticated members
router.get('/global-search', protect, memberController.searchGlobalMembers);
router.get('/public-profile/:id', protect, memberController.getPublicMemberProfile);

// List all members of the church
router.get('/', protect, memberController.getAllMembers);

// ── Admin Routes (require 'members' permission) ─────────────────────────────

router.post('/', protect, hasPermission('members'), memberController.createMember);

// IMPORTANT: parameterized /:id routes come AFTER all literal routes
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
