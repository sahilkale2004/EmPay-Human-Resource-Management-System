const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const isAdminOrHR = ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(req.user.role);

    if (isAdminOrHR) {
      // 1. Admin/HR Counters
      const [[{ totalEmployees }]] = await pool.query('SELECT COUNT(*) as totalEmployees FROM employees e JOIN users u ON e.user_id = u.id WHERE u.is_active = TRUE');
      const [[{ todayPresent }]] = await pool.query('SELECT COUNT(*) as todayPresent FROM attendances WHERE date = CURDATE() AND status = "PRESENT"');
      const [[{ pendingTimeOff }]] = await pool.query('SELECT COUNT(*) as pendingTimeOff FROM time_off_requests WHERE status = "PENDING"');

      // 2. Recent Employees with Status
      const [employees] = await pool.query(
        `SELECT e.id, e.first_name, e.last_name, e.job_position, 
                (SELECT status FROM attendances WHERE employee_id = e.id AND date = CURDATE() LIMIT 1) as status
         FROM employees e 
         LIMIT 6`
      );

      // 3. Warnings
      const [[{ noBank }]] = await pool.query('SELECT COUNT(*) as noBank FROM employees WHERE bank_account_number IS NULL OR bank_account_number = ""');
      const [[{ noManager }]] = await pool.query('SELECT COUNT(*) as noManager FROM employees WHERE manager_id IS NULL');

      // 4. Charts - Headcount Distribution (Active only, handle NULL departments)
      const [deptStats] = await pool.query(`
        SELECT IFNULL(department, 'Unassigned') as name, COUNT(*) as withSalary 
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE u.is_active = TRUE
        GROUP BY department
      `);
      
      // 5. Charts - Payroll Trend (Only confirmed payruns)
      const [payrollTrends] = await pool.query(
        `SELECT pr.name, SUM(IFNULL(p.net_payable, 0)) as amount 
         FROM payslips p 
         JOIN payruns pr ON p.payrun_id = pr.id 
         WHERE p.status IN ('DONE', 'VALIDATED')
         GROUP BY pr.id 
         ORDER BY pr.created_at ASC 
         LIMIT 6`
      );

      return res.json({
        success: true,
        data: {
          totalEmployees,
          todayPresent,
          pendingTimeOff,
          employees,
          warnings: { noBank, noManager },
          charts: {
            employeeChart: deptStats,
            payrunTrend: payrollTrends.reverse()
          }
        }
      });
    } else {
      // 1. Employee Stats
      const employeeId = req.user.employee_id;
      const [[{ daysPresentThisMonth }]] = await pool.query(
        'SELECT COUNT(*) as daysPresentThisMonth FROM attendances WHERE employee_id = ? AND MONTH(date) = MONTH(CURDATE()) AND status = "PRESENT"',
        [employeeId]
      );

      const [[{ leaveBalance }]] = await pool.query(
        'SELECT SUM(remaining_days) as leaveBalance FROM time_off_allocations WHERE employee_id = ?',
        [employeeId]
      );

      // 2. Recent Attendance
      const [recentAttendance] = await pool.query(
        'SELECT * FROM attendances WHERE employee_id = ? ORDER BY date DESC LIMIT 5',
        [employeeId]
      );

      // 3. Today's Status
      const [todayAttendance] = await pool.query(
        'SELECT * FROM attendances WHERE employee_id = ? AND date = CURDATE() LIMIT 1',
        [employeeId]
      );

      return res.json({
        success: true,
        data: {
          daysPresentThisMonth,
          leaveBalance: leaveBalance || 0,
          recentAttendance,
          todayAttendance: todayAttendance[0] || null
        }
      });
    }
  } catch (err) {
    console.error('GET dashboard stats error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getDashboardStats
};
