const express = require('express');
const router = express.Router();
const sundaySchoolController = require('../controllers/sundaySchoolController');
const { protect, hasPermission } = require('../middleware/authGuard');

// Apply auth middleware to all routes
router.use(protect);

// Classes
router.get('/classes', hasPermission('sunday-school'), sundaySchoolController.getClasses);
router.get('/my-classes', sundaySchoolController.getMyClasses);
router.get('/classes/:id', sundaySchoolController.getClassById);
router.post('/classes', hasPermission('sunday-school'), sundaySchoolController.createClass);
router.put('/classes/:id', hasPermission('sunday-school'), sundaySchoolController.updateClass);
router.delete('/classes/:id', hasPermission('sunday-school'), sundaySchoolController.deleteClass);

// Monitors
router.get('/monitors', hasPermission('sunday-school'), sundaySchoolController.getMonitors);
router.post('/monitors', hasPermission('sunday-school'), sundaySchoolController.assignMonitor);
router.put('/monitors/:id', hasPermission('sunday-school'), sundaySchoolController.updateMonitor);
router.delete('/monitors/:id', hasPermission('sunday-school'), sundaySchoolController.removeMonitor);

// Attendance
router.post('/attendance', hasPermission('sunday-school'), sundaySchoolController.markAttendance);
router.get('/my-attendance', sundaySchoolController.getMyAttendance);

// Reports
router.get('/reports', sundaySchoolController.getReports);
router.get('/my-class-reports', sundaySchoolController.getMyClassReports);
router.delete('/reports-bulk/:classId', hasPermission('sunday-school'), sundaySchoolController.deleteAllReports);
router.get('/reports/:id', sundaySchoolController.getReportById); // Allow viewing specific report (will check access in controller)
router.post('/reports', hasPermission('sunday-school'), sundaySchoolController.submitReport);
router.post('/reports/:reportId/comments', sundaySchoolController.addReportComment);
router.put('/reports/:id', hasPermission('sunday-school'), sundaySchoolController.updateReport);
router.delete('/reports/:id', hasPermission('sunday-school'), sundaySchoolController.deleteReport);

// Stats
router.get('/stats', hasPermission('sunday-school'), sundaySchoolController.getStats);

// Admin: Force re-sync all members against dynamic class criteria
router.post('/sync-auto-assignments', hasPermission('sunday-school'), sundaySchoolController.syncAllAutoAssignments);

module.exports = router;
