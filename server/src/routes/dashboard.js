const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    let data = {};

    if (['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(role)) {
      const [empRes] = await pool.query(`SELECT COUNT(*) as total FROM employees JOIN users u ON employees.user_id = u.id WHERE u.is_active = TRUE`);
      const [timeOffRes] = await pool.query(`SELECT COUNT(*) as pending FROM time_off_requests WHERE status = 'PENDING'`);
      const [attRes] = await pool.query(`SELECT COUNT(*) as today_present FROM attendances WHERE date = CURDATE() AND status IN ('PRESENT', 'HALF_DAY')`);
      
      data = {
        totalEmployees: empRes[0].total,
        pendingTimeOff: timeOffRes[0].pending,
        todayPresent: attRes[0].today_present
      };
    } else {
      // For Employee
      const empId = req.user.employee_id;
      const [attRes] = await pool.query(`SELECT COUNT(*) as days_present FROM attendances WHERE employee_id = ? AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())`, [empId]);
      const [leaveRes] = await pool.query(`SELECT SUM(number_of_days) as pending_leaves FROM time_off_requests WHERE employee_id = ? AND status = 'PENDING'`, [empId]);
      
      data = {
        daysPresentThisMonth: attRes[0].days_present,
        pendingLeaves: leaveRes[0].pending_leaves || 0
      };
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
