const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

// GET /api/attendance
router.get('/', authenticateToken, attendanceController.getAllAttendance);

// GET /api/attendance/today/:employeeId
router.get('/today/:employeeId', authenticateToken, attendanceController.getTodayAttendanceByEmployeeId);

// GET /api/attendance/today-status
router.get('/today-status', authenticateToken, attendanceController.getTodayStatus);

// POST /api/attendance/check-in
router.post('/check-in', authenticateToken, attendanceController.checkIn);
router.post('/checkin', authenticateToken, attendanceController.checkIn);

// POST /api/attendance/check-out
router.post('/check-out', authenticateToken, attendanceController.checkOut);
router.post('/checkout', authenticateToken, attendanceController.checkOut);

module.exports = router;
