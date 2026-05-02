const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const payrollController = require('../controllers/payrollController');

const router = express.Router();

// GET /api/payroll/runs
router.get('/runs', authenticateToken, requireRole(['ADMIN', 'PAYROLL_OFFICER']), payrollController.getPayruns);

// POST /api/payroll/runs
router.post('/runs', authenticateToken, requireRole(['ADMIN', 'PAYROLL_OFFICER']), payrollController.createPayrun);

// POST /api/payroll/runs/:id/generate
router.post('/runs/:id/generate', authenticateToken, requireRole(['ADMIN', 'PAYROLL_OFFICER']), payrollController.generatePayslips);

// PUT /api/payroll/runs/:id/validate
router.put('/runs/:id/validate', authenticateToken, requireRole(['ADMIN', 'PAYROLL_OFFICER']), payrollController.validatePayrun);

// GET /api/payroll/slips
router.get('/slips', authenticateToken, payrollController.getPayslips);

// GET /api/payroll/slips/:id
router.get('/slips/:id', authenticateToken, payrollController.getPayslipById);

// GET /api/payroll/fund
router.get('/fund', authenticateToken, requireRole(['ADMIN', 'PAYROLL_OFFICER']), payrollController.getCompanyFund);

// POST /api/payroll/fund/add
router.post('/fund/add', authenticateToken, requireRole(['ADMIN', 'PAYROLL_OFFICER']), payrollController.addCompanyFund);

// GET /api/payroll/stats
router.get('/stats', authenticateToken, requireRole(['ADMIN', 'PAYROLL_OFFICER']), payrollController.getPayrollStats);

// GET /api/payroll/report-summary
router.get('/report-summary', authenticateToken, requireRole(['ADMIN', 'PAYROLL_OFFICER']), payrollController.getPayrollReportSummary);

module.exports = router;
