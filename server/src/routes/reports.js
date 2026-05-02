const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const reportsController = require('../controllers/reportsController');

const router = express.Router();

// GET /api/reports/salary-attachment
router.get('/salary-attachment', authenticateToken, requireRole(['ADMIN', 'PAYROLL_OFFICER']), reportsController.getSalaryAttachment);

// GET /api/reports/headcount
router.get('/headcount', authenticateToken, requireRole(['ADMIN', 'HR_OFFICER']), reportsController.getHeadcount);

module.exports = router;
