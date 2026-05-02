const pool = require('../config/db');

const getSalaryAttachment = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ success: false, error: 'Month and year are required' });

    const [rows] = await pool.query(
      `SELECT 
        SUM(basic_wage) as total_basic, 
        SUM(hra + standard_allowance + travel_allowance + food_allowance) as total_allowances,
        SUM(pf + professional_tax) as total_deductions,
        SUM(net_payable) as total_net
       FROM payslips 
       WHERE MONTH(generated_at) = ? AND YEAR(generated_at) = ?`,
      [month, year]
    );
    
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Salary attachment report error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getHeadcount = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT department, COUNT(*) as count FROM employees GROUP BY department`);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getSalaryAttachment,
  getHeadcount
};
