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

const upload = require('../config/upload');

// PUT /api/employees/:id (All roles can update self, Admin/HR can update any)
router.put('/:id', authenticateToken, upload.single('profile_picture'), employeeController.updateEmployee);

// DELETE /api/employees/:id (Admin only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), employeeController.deleteEmployee);

// Salary Structure Routes
router.get('/:id/salary', authenticateToken, employeeController.getSalary);
router.post('/:id/salary', authenticateToken, requireRole(['ADMIN', 'PAYROLL_OFFICER']), employeeController.saveSalary);
router.put('/:id/salary', authenticateToken, requireRole(['ADMIN', 'PAYROLL_OFFICER']), employeeController.saveSalary);

module.exports = router;
