const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings/company
router.get('/company', authenticateToken, async (req, res) => {
  res.json({ success: true, data: { company_code: process.env.COMPANY_CODE || 'CC', name: 'EmPay Inc' } });
});

module.exports = router;
