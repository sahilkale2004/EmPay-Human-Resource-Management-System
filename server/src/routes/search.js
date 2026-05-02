const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/db');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const [rows] = await pool.query(
      `SELECT e.id, e.first_name, e.last_name, e.department, e.job_position, e.profile_picture, u.role
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.first_name LIKE ? OR e.last_name LIKE ? OR u.login_id LIKE ?
       LIMIT 5`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
