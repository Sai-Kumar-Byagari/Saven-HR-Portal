const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { uploadPunchPhotoFile } = require('../middleware/upload');
const attendanceController = require('../controllers/attendance.controller');

router.post('/clock-in',  authMiddleware, uploadPunchPhotoFile, attendanceController.clockIn);
router.post('/clock-out', authMiddleware, uploadPunchPhotoFile, attendanceController.clockOut);
router.get('/today',          authMiddleware, attendanceController.getTodayAttendance);
router.get('/my',             authMiddleware, attendanceController.getMyAttendance);
router.get('/team',           authMiddleware, rbac('super_admin','manager','hr'), attendanceController.getTeamAttendance);
router.get('/all',            authMiddleware, rbac('super_admin','hr','payroll'), attendanceController.getAllAttendance);
router.get('/weekly-summary', authMiddleware, attendanceController.getWeeklyAttendanceSummary);
router.get('/absent-summary', authMiddleware, rbac('super_admin','hr','payroll'), attendanceController.getAbsentSummary);
router.get('/report',         authMiddleware, rbac('super_admin','hr','payroll','manager'), attendanceController.downloadAttendanceReport);
router.get('/user-report/:userId', authMiddleware, rbac('super_admin','hr','payroll','manager'), attendanceController.getUserReport);
router.put('/:id/update-status', authMiddleware, rbac('super_admin','manager'), attendanceController.updateAttendanceStatus);

module.exports = router;
