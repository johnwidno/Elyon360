const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');
const reservationController = require('../controllers/reservationController');
const logisticsController = require('../controllers/logisticsController');
const authGuard = require('../middleware/authGuard');

// Middleware to verify token and church
router.use([authGuard.protect]);

// Dashboard
router.get('/dashboard/stats', logisticsController.getDashboardStats);

// Availability Check
router.post('/check-availability', logisticsController.checkAvailability);

// Buildings
router.post('/buildings', spaceController.createBuilding);
router.get('/buildings', spaceController.getAllBuildings);
router.put('/buildings/:id', spaceController.updateBuilding);
router.delete('/buildings/:id', spaceController.deleteBuilding);

// Rooms
router.post('/rooms', spaceController.createRoom);
router.get('/rooms', spaceController.getAllRooms);
router.get('/rooms/:id', spaceController.getRoomById);
router.put('/rooms/:id', spaceController.updateRoom);
router.delete('/rooms/:id', spaceController.deleteRoom);

// Reservations
router.post('/reservations', reservationController.createReservation);
router.get('/reservations', reservationController.getAllReservations);
router.put('/reservations/:id', reservationController.updateReservation);
router.delete('/reservations/:id', reservationController.deleteReservation);

// Maintenance
const maintenanceController = require('../controllers/maintenanceController');
router.post('/maintenance', maintenanceController.createMaintenanceLog);
router.get('/maintenance', maintenanceController.getAllMaintenanceLogs);
router.put('/maintenance/:id', maintenanceController.updateMaintenanceLog);
router.delete('/maintenance/:id', maintenanceController.deleteMaintenanceLog);

module.exports = router;
