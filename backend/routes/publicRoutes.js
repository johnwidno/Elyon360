const express = require('express');
const router = express.Router();
const publicActivityController = require('../controllers/publicActivityController');
const publicEventController = require('../controllers/publicEventController');

// Activities
router.get('/activities/:token', publicActivityController.getActivityByToken);
router.post('/activities/:token/register', publicActivityController.registerParticipant);
router.post('/activities/:token/register-member', publicActivityController.registerMember);

// Events
router.get('/events/:token', publicEventController.getEventByToken);
router.post('/events/:token/register-guest', publicEventController.registerGuest);
router.post('/events/:token/register-member', publicEventController.registerMember);

module.exports = router;
