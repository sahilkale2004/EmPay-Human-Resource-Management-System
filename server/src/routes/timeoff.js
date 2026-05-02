const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const timeoffController = require('../controllers/timeoffController');

const router = express.Router();

// GET /api/timeoff
router.get('/', authenticateToken, timeoffController.getTimeOffRequests);

// GET /api/timeoff/allocation
router.get('/allocation', authenticateToken, timeoffController.getAllocations);

// POST /api/timeoff
router.post('/', authenticateToken, timeoffController.createTimeOffRequest);

// PUT /api/timeoff/:id/approve
router.put('/:id/approve', authenticateToken, requireRole(['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER']), timeoffController.approveRequest);

// PUT /api/timeoff/:id/refuse
router.put('/:id/refuse', authenticateToken, requireRole(['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER']), timeoffController.refuseRequest);

module.exports = router;
