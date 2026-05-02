const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/headcount
router.get('/headcount', authenticateToken, requireRole(['ADMIN', 'HR_OFFICER']), async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT department, COUNT(*) as count FROM employees GROUP BY department`);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
