const express = require('express');
const router = express.Router();
const sundaySchoolController = require('../controllers/sundaySchoolController');
const { protect, hasPermission } = require('../middleware/authGuard');

// Apply auth middleware to all routes
router.use(protect);
router.use(hasPermission('sunday-school'));

// Classes
router.get('/classes', sundaySchoolController.getClasses);
router.get('/classes/:id', sundaySchoolController.getClassById);
router.post('/classes', sundaySchoolController.createClass);
router.put('/classes/:id', sundaySchoolController.updateClass);
router.delete('/classes/:id', sundaySchoolController.deleteClass);

// Monitors
router.get('/monitors', sundaySchoolController.getMonitors);
router.post('/monitors', sundaySchoolController.assignMonitor);
router.put('/monitors/:id', sundaySchoolController.updateMonitor);
router.delete('/monitors/:id', sundaySchoolController.removeMonitor);

// Attendance
router.post('/attendance', sundaySchoolController.markAttendance);

// Reports
router.get('/reports', sundaySchoolController.getReports);
router.delete('/reports-bulk/:classId', sundaySchoolController.deleteAllReports);
router.get('/reports/:id', sundaySchoolController.getReportById);
router.post('/reports', sundaySchoolController.submitReport);
router.put('/reports/:id', sundaySchoolController.updateReport);
router.delete('/reports/:id', sundaySchoolController.deleteReport);

// Stats
router.get('/stats', sundaySchoolController.getStats);

module.exports = router;
