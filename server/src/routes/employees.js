const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

const router = express.Router();

// GET /api/employees
router.get('/', authenticateToken, employeeController.getAllEmployees);

// GET /api/employees/:id
router.get('/:id', authenticateToken, employeeController.getEmployeeById);

// POST /api/employees (Admin, HR only)
router.post('/', authenticateToken, requireRole(['ADMIN', 'HR_OFFICER']), employeeController.createEmployee);

// PUT /api/employees/:id
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER']), employeeController.updateEmployee);

// DELETE /api/employees/:id (Admin only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), employeeController.deleteEmployee);

module.exports = router;
