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

// POST /api/attendance/checkin
router.post('/checkin', authenticateToken, attendanceController.checkIn);

// POST /api/attendance/checkout
router.post('/checkout', authenticateToken, attendanceController.checkOut);

module.exports = router;
