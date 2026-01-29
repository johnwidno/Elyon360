const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const groupActivityController = require('../controllers/groupActivityController');
const { protect, authorize } = require('../middleware/authGuard');

router.post('/', protect, authorize('admin', 'super_admin'), groupController.createGroup);
router.get('/', protect, authorize('admin', 'super_admin', 'member'), groupController.getAllGroups);
router.put('/:id', protect, authorize('admin', 'super_admin'), groupController.updateGroup); // UPDATE
router.delete('/:id', protect, authorize('admin', 'super_admin'), groupController.deleteGroup);

// Member Management Routes
router.get('/:id/members', protect, authorize('admin', 'super_admin', 'member'), groupController.getGroupMembers);
router.post('/:id/members', protect, authorize('admin', 'super_admin'), groupController.addMember);
router.delete('/:id/members/:userId', protect, authorize('admin', 'super_admin'), groupController.removeMember);
router.put('/:id/members/:userId', protect, authorize('admin', 'super_admin'), groupController.updateMemberRole);

// Group Activities Routes
router.post('/:groupId/activities', protect, authorize('admin', 'super_admin', 'leader'), groupActivityController.createActivity);
router.get('/:groupId/activities', protect, authorize('admin', 'super_admin', 'leader', 'member'), groupActivityController.getGroupActivities);
router.get('/:groupId/activities/:activityId', protect, authorize('admin', 'super_admin', 'leader', 'member'), groupActivityController.getActivityDetails);
router.put('/:groupId/activities/:activityId', protect, authorize('admin', 'super_admin', 'leader'), groupActivityController.updateActivity);
router.delete('/:groupId/activities/:activityId', protect, authorize('admin', 'super_admin', 'leader'), groupActivityController.deleteActivity);

// Activity Participants
router.post('/:groupId/activities/:activityId/participants', protect, authorize('admin', 'super_admin', 'leader'), groupActivityController.addParticipant);
router.put('/:groupId/activities/:activityId/participants/:participantId', protect, authorize('admin', 'super_admin', 'leader'), groupActivityController.updateParticipantStatus);
router.delete('/:groupId/activities/:activityId/participants/:participantId', protect, authorize('admin', 'super_admin', 'leader'), groupActivityController.removeParticipant);

module.exports = router;
