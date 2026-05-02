const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/timeoff
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT t.*, e.first_name, e.last_name, tt.name as time_off_type_name, tt.is_paid 
      FROM time_off_requests t
      JOIN employees e ON t.employee_id = e.id
      JOIN time_off_types tt ON t.time_off_type_id = tt.id
    `;
    const params = [];

    if (req.user.role === 'EMPLOYEE') {
      query += ` WHERE t.employee_id = ?`;
      params.push(req.user.employee_id);
    }
    
    query += ` ORDER BY t.created_at DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET timeoff requests error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/timeoff
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { time_off_type_id, start_date, end_date, reason, attachment } = req.body;
    let employeeId = req.body.employee_id;

    if (req.user.role === 'EMPLOYEE') {
      employeeId = req.user.employee_id;
    }

    if (!employeeId || !time_off_type_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Auto calculate days (simplistic: end - start + 1)
    const sDate = new Date(start_date);
    const eDate = new Date(end_date);
    const diffTime = Math.abs(eDate - sDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const [result] = await pool.query(
      `INSERT INTO time_off_requests 
       (employee_id, time_off_type_id, start_date, end_date, number_of_days, reason, attachment, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [employeeId, time_off_type_id, start_date, end_date, diffDays, reason || null, attachment || null]
    );

    res.status(201).json({ success: true, message: 'Time off requested', data: { id: result.insertId } });
  } catch (err) {
    console.error('POST timeoff error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/timeoff/:id/approve
router.put('/:id/approve', authenticateToken, requireRole(['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER']), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    
    await connection.beginTransaction();

    const [reqs] = await connection.query('SELECT * FROM time_off_requests WHERE id = ?', [id]);
    if (reqs.length === 0) return res.status(404).json({ success: false, error: 'Request not found' });
    
    const request = reqs[0];
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Request is already processed' });
    }

    // Deduct allocation if applicable
    const [allocations] = await connection.query(
      `SELECT * FROM time_off_allocations 
       WHERE employee_id = ? AND time_off_type_id = ? 
       AND validity_start <= ? AND validity_end >= ?`,
      [request.employee_id, request.time_off_type_id, request.start_date, request.start_date]
    );

    if (allocations.length > 0) {
      const alloc = allocations[0];
      if (alloc.remaining_days < request.number_of_days) {
         // Should we allow negative or block? Depending on policy. Let's just deduct for now.
      }
      await connection.query(
        `UPDATE time_off_allocations SET remaining_days = remaining_days - ? WHERE id = ?`,
        [request.number_of_days, alloc.id]
      );
    }

    await connection.query(
      `UPDATE time_off_requests SET status = 'APPROVED', approved_by = ?, approved_at = NOW() WHERE id = ?`,
      [req.user.id, id]
    );

    await connection.commit();
    res.json({ success: true, message: 'Time off approved' });
  } catch (err) {
    await connection.rollback();
    console.error('Approve timeoff error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// PUT /api/timeoff/:id/refuse
router.put('/:id/refuse', authenticateToken, requireRole(['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query(
      `UPDATE time_off_requests SET status = 'REFUSED', approved_by = ?, approved_at = NOW() WHERE id = ? AND status = 'PENDING'`,
      [req.user.id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, error: 'Request not found or already processed' });
    }

    res.json({ success: true, message: 'Time off refused' });
  } catch (err) {
    console.error('Refuse timeoff error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/timeoff/allocation
router.get('/allocation', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT a.*, e.first_name, e.last_name, tt.name as time_off_type_name
      FROM time_off_allocations a
      JOIN employees e ON a.employee_id = e.id
      JOIN time_off_types tt ON a.time_off_type_id = tt.id
    `;
    const params = [];

    if (req.user.role === 'EMPLOYEE') {
      query += ` WHERE a.employee_id = ?`;
      params.push(req.user.employee_id);
    }
    
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET timeoff allocations error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/timeoff/allocation
router.post('/allocation', authenticateToken, requireRole(['ADMIN', 'HR_OFFICER']), async (req, res) => {
  try {
    const { employee_id, time_off_type_id, validity_start, validity_end, allocated_days } = req.body;
    
    if (!employee_id || !time_off_type_id || !validity_start || !validity_end || !allocated_days) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    await pool.query(
      `INSERT INTO time_off_allocations 
       (employee_id, time_off_type_id, validity_start, validity_end, allocated_days, remaining_days) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_id, time_off_type_id, validity_start, validity_end, allocated_days, allocated_days]
    );

    res.status(201).json({ success: true, message: 'Time off allocated' });
  } catch (err) {
    console.error('POST timeoff allocation error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/timeoff/types
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM time_off_types');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
