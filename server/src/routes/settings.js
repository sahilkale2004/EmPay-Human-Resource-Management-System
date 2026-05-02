const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

// GET /api/settings/users
router.get('/users', authenticateToken, requireRole(['ADMIN']), settingsController.getUsers);

// PUT /api/settings/users/:id/role
router.put('/users/:id/role', authenticateToken, requireRole(['ADMIN']), settingsController.updateUserRole);

// GET /api/settings/company
router.get('/company', authenticateToken, settingsController.getCompanyInfo);

module.exports = router;
