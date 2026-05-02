const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me
router.get('/me', authenticateToken, authController.getMe);

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
