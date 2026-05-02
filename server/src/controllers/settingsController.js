const pool = require('../config/db');

const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.login_id, u.email, u.role, u.is_active, e.first_name, e.last_name 
       FROM users u 
       JOIN employees e ON u.id = e.user_id 
       WHERE u.is_active = TRUE`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET settings users error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ success: true, message: 'User role updated' });
  } catch (err) {
    console.error('PUT user role error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getCompanyInfo = async (req, res) => {
  res.json({ success: true, data: { company_code: process.env.COMPANY_CODE || 'CC', name: process.env.COMPANY_NAME || 'EmPay' } });
};

module.exports = {
  getUsers,
  updateUserRole,
  getCompanyInfo
};
