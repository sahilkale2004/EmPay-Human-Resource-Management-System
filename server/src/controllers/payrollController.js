const pool = require('../config/db');
const { generatePayslipsForPayrun } = require('../services/payrollService');

const getPayruns = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT r.*, u.login_id as created_by_id FROM payruns r JOIN users u ON r.created_by = u.id ORDER BY r.created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET payruns error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const createPayrun = async (req, res) => {
  try {
    const { name, period_start, period_end } = req.body;
    if (!name || !period_start || !period_end) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const [result] = await pool.query(
      `INSERT INTO payruns (name, period_start, period_end, status, created_by) VALUES (?, ?, ?, 'DRAFT', ?)`,
      [name, period_start, period_end, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Payrun created', data: { id: result.insertId } });
  } catch (err) {
    console.error('POST payrun error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const generatePayslips = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await generatePayslipsForPayrun(id);
    res.json({ success: true, message: `Generated ${result.count} payslips for payrun ${id}` });
  } catch (err) {
    console.error('Generate payslips error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
};

const validatePayrun = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();
    await connection.query(`UPDATE payruns SET status = 'VALIDATED' WHERE id = ?`, [id]);
    await connection.query(`UPDATE payslips SET status = 'DONE' WHERE payrun_id = ?`, [id]);
    await connection.commit();
    res.json({ success: true, message: 'Payrun validated successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Validate payrun error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

const getPayslips = async (req, res) => {
  try {
    let query = `
      SELECT p.*, e.first_name, e.last_name, pr.name as payrun_name 
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      JOIN payruns pr ON p.payrun_id = pr.id
    `;
    const params = [];
    if (req.user.role === 'EMPLOYEE') {
      query += ` WHERE p.employee_id = ? AND p.status = 'DONE'`;
      params.push(req.user.employee_id);
    }
    query += ` ORDER BY p.generated_at DESC`;
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET payslips error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getPayslipById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT p.*, e.first_name, e.last_name, e.department, e.job_position, e.bank_account_number, e.ifsc_code, e.bank_name, pr.name as payrun_name 
       FROM payslips p
       JOIN employees e ON p.employee_id = e.id
       JOIN payruns pr ON p.payrun_id = pr.id
       WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Payslip not found' });
    const slip = rows[0];
    if (req.user.role === 'EMPLOYEE' && slip.employee_id !== req.user.employee_id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    res.json({ success: true, data: slip });
  } catch (err) {
    console.error('GET payslip by id error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getPayruns,
  createPayrun,
  generatePayslips,
  validatePayrun,
  getPayslips,
  getPayslipById
};
