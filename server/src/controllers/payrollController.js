const pool = require('../config/db');
const { generatePayslipsForPayrun } = require('../services/payrollService');

const getPayruns = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, u.login_id as created_by_id,
      (SELECT COUNT(*) FROM payslips WHERE payrun_id = r.id) as employee_count,
      (SELECT SUM(net_payable) FROM payslips WHERE payrun_id = r.id) as total_amount
      FROM payruns r 
      JOIN users u ON r.created_by = u.id 
      ORDER BY r.created_at DESC
    `);
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
    
    // Check total cost
    const [costRows] = await connection.query(`SELECT SUM(net_payable) as total FROM payslips WHERE payrun_id = ?`, [id]);
    const totalCost = costRows[0].total || 0;
    
    // Check available fund
    const [fundRows] = await connection.query(`SELECT available_balance FROM company_funds ORDER BY id DESC LIMIT 1`);
    if (fundRows.length === 0) {
      await connection.query(`INSERT INTO company_funds (available_balance) VALUES (0)`);
      fundRows.push({ available_balance: 0 });
    }
    const currentFund = fundRows[0].available_balance;
    
    if (parseFloat(currentFund) < parseFloat(totalCost)) {
      await connection.rollback();
      return res.status(400).json({ success: false, error: 'Insufficient company funds to validate this payrun. Please add funds.' });
    }
    
    // Deduct fund
    await connection.query(`UPDATE company_funds SET available_balance = available_balance - ? ORDER BY id DESC LIMIT 1`, [totalCost]);
    
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
      SELECT p.*, e.first_name, e.last_name, e.department, u.login_id, pr.name as payrun_name 
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
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

const path = require('path');
const { generatePayslipPDF } = require('../services/pdfService');

const exportPayrun = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get payslips for the payrun
    const [payslips] = await pool.query(`
      SELECT p.*, e.first_name, e.last_name, e.department, u.login_id, pr.name as payrun_name 
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      JOIN payruns pr ON p.payrun_id = pr.id
      WHERE p.payrun_id = ?
    `, [id]);

    if (payslips.length === 0) {
      return res.status(404).json({ success: false, error: 'No payslips found to export' });
    }

    const payrunName = payslips[0].payrun_name;
    const exportDir = path.join(__dirname, '../../exports/payslips');
    
    // Generate PDFs
    const exportPromises = payslips.map(slip => generatePayslipPDF(slip, payrunName, exportDir));
    const paths = await Promise.all(exportPromises);

    res.json({ 
      success: true, 
      message: `Exported ${paths.length} payslips successfully`,
      path: path.join(exportDir, payrunName)
    });
  } catch (err) {
    console.error('Export payrun error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during export' });
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

const getPayrollStats = async (req, res) => {
  try {
    const [empRows] = await pool.query('SELECT COUNT(*) as count FROM employees e JOIN users u ON e.user_id = u.id WHERE u.is_active = TRUE');
    const [costRows] = await pool.query(`
      SELECT SUM(ss.monthly_wage) as total 
      FROM salary_structures ss 
      JOIN employees e ON ss.employee_id = e.id 
      JOIN users u ON e.user_id = u.id 
      WHERE u.is_active = TRUE
    `);
    
    res.json({ 
      success: true, 
      data: { 
        totalEmployees: empRows[0].count || 0, 
        totalCost: costRows[0].total || 0 
      } 
    });
  } catch (err) {
    console.error('GET payroll stats error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getPayrollReportSummary = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        SUM(basic_salary) as total_basic,
        SUM(hra + standard_allowance + performance_bonus + travel_allowance + food_allowance) as total_allowances,
        SUM(pf_employee + professional_tax) as total_deductions,
        SUM(net_payable) as total_net
      FROM payslips 
      WHERE status = 'DONE'
    `);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GET report summary error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getCompanyFund = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT available_balance FROM company_funds ORDER BY id DESC LIMIT 1`);
    const balance = rows.length > 0 ? rows[0].available_balance : 0;
    res.json({ success: true, data: { balance } });
  } catch (err) {
    console.error('GET company fund error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const addCompanyFund = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }
    // Ensure row exists
    const [rows] = await pool.query(`SELECT id FROM company_funds ORDER BY id DESC LIMIT 1`);
    if (rows.length === 0) {
      await pool.query(`INSERT INTO company_funds (available_balance) VALUES (?)`, [amount]);
    } else {
      await pool.query(`UPDATE company_funds SET available_balance = available_balance + ? ORDER BY id DESC LIMIT 1`, [amount]);
    }
    res.json({ success: true, message: `Added ₹${amount} to company fund successfully.` });
  } catch (err) {
    console.error('POST add company fund error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getPayruns,
  createPayrun,
  generatePayslips,
  validatePayrun,
  getPayslips,
  exportPayrun,
  getPayslipById,
  getPayrollStats,
  getPayrollReportSummary,
  getCompanyFund,
  addCompanyFund
};
