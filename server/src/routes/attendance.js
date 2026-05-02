const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/attendance
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT a.*, e.first_name, e.last_name, e.department
      FROM attendances a
      JOIN employees e ON a.employee_id = e.id
    `;
    const params = [];

    // If Employee, only show their own records
    if (req.user.role === 'EMPLOYEE') {
      query += ` WHERE a.employee_id = ?`;
      params.push(req.user.employee_id);
    }
    
    query += ` ORDER BY a.date DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET attendance error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/attendance/today/:employeeId
router.get('/today/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    if (req.user.role === 'EMPLOYEE' && String(req.user.employee_id) !== employeeId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    const [rows] = await pool.query(
      `SELECT * FROM attendances WHERE employee_id = ? AND date = ? LIMIT 1`,
      [employeeId, today]
    );

    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('GET attendance today error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/attendance/checkin
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    if (!employeeId) {
      return res.status(400).json({ success: false, error: 'User is not an employee' });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const [existing] = await pool.query(
      `SELECT id FROM attendances WHERE employee_id = ? AND date = ?`,
      [employeeId, today]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Already checked in today' });
    }

    const [result] = await pool.query(
      `INSERT INTO attendances (employee_id, date, check_in, status) VALUES (?, ?, ?, 'PRESENT')`,
      [employeeId, today, now]
    );

    res.status(201).json({ success: true, message: 'Checked in successfully', data: { id: result.insertId } });
  } catch (err) {
    console.error('Checkin error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/attendance/checkout
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    if (!employeeId) {
      return res.status(400).json({ success: false, error: 'User is not an employee' });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const [existing] = await pool.query(
      `SELECT * FROM attendances WHERE employee_id = ? AND date = ?`,
      [employeeId, today]
    );

    if (existing.length === 0) {
      return res.status(400).json({ success: false, error: 'Must check in first' });
    }

    if (existing[0].check_out) {
      return res.status(400).json({ success: false, error: 'Already checked out today' });
    }

    // Calculate work hours
    const checkInTime = new Date(existing[0].check_in);
    const diffMs = now - checkInTime;
    const workHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
    
    // Assume 8 hours is standard
    let overtimeHours = 0;
    if (workHours > 8) {
      overtimeHours = (workHours - 8).toFixed(2);
    }

    await pool.query(
      `UPDATE attendances SET check_out = ?, work_hours = ?, overtime_hours = ? WHERE id = ?`,
      [now, workHours, overtimeHours, existing[0].id]
    );

    res.json({ success: true, message: 'Checked out successfully' });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
