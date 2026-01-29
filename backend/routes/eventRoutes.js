const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventDetails);
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// Participant management
router.post('/:id/participants/member', eventController.addMemberParticipant);
router.post('/:id/participants/guest', eventController.addGuestParticipant);
router.delete('/:id/participants/:participantId', eventController.removeParticipant);

module.exports = router;
