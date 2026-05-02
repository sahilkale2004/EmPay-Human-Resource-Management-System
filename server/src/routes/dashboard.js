const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, dashboardController.getDashboardStats);

module.exports = router;
