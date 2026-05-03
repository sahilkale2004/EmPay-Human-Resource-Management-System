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

const getAttendanceSummary = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as total_present,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as total_absent,
        SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) as total_half_day,
        SUM(CASE WHEN status = 'ON_LEAVE' THEN 1 ELSE 0 END) as total_on_leave,
        SUM(work_hours) as total_work_hours,
        SUM(overtime_hours) as total_overtime_hours
      FROM attendances
    `);
    
    // Calculate average work hours per present/half_day
    const data = rows[0];
    const presentCount = Number(data.total_present) + Number(data.total_half_day);
    data.avg_work_hours = presentCount > 0 ? (Number(data.total_work_hours) / presentCount).toFixed(2) : 0;
    
    res.json({ success: true, data });
  } catch (err) {
    console.error('Attendance summary report error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getLeaveSummary = async (req, res) => {
  try {
    const [overallRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'APPROVED' THEN number_of_days ELSE 0 END) as total_approved_days,
        SUM(CASE WHEN status = 'REFUSED' THEN 1 ELSE 0 END) as total_refused
      FROM time_off_requests
    `);

    const [typeRows] = await pool.query(`
      SELECT t.name, SUM(r.number_of_days) as approved_days
      FROM time_off_requests r
      JOIN time_off_types t ON r.time_off_type_id = t.id
      WHERE r.status = 'APPROVED'
      GROUP BY t.id, t.name
    `);

    res.json({ 
      success: true, 
      data: {
        ...overallRows[0],
        breakdown: typeRows
      }
    });
  } catch (err) {
    console.error('Leave summary report error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getSalaryAttachment,
  getHeadcount,
  getAttendanceSummary,
  getLeaveSummary
};
