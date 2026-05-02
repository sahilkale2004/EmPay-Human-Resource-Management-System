const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const [[{ total_employees }]] = await pool.query('SELECT COUNT(*) as total_employees FROM employees e JOIN users u ON e.user_id = u.id WHERE u.is_active = TRUE');
    const [[{ active_attendance }]] = await pool.query('SELECT COUNT(*) as active_attendance FROM attendances WHERE date = CURDATE() AND status = "PRESENT"');
    
    const [payroll_trends] = await pool.query(
      `SELECT pr.name as month, SUM(p.net_payable) as total 
       FROM payslips p 
       JOIN payruns pr ON p.payrun_id = pr.id 
       GROUP BY pr.id 
       ORDER BY pr.created_at DESC 
       LIMIT 6`
    );

    res.json({
      success: true,
      data: {
        total_employees,
        active_attendance,
        payroll_trends: payroll_trends.reverse()
      }
    });
  } catch (err) {
    console.error('GET dashboard stats error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats
};
