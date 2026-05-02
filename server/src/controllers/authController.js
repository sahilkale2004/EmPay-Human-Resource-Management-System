const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { generateLoginId } = require('../services/idGenerator');
const { initializeAllocations } = require('../services/timeOffService');

const register = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, email, phone, password, companyName } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    await connection.beginTransaction();

    const parts = name.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
    const dateOfJoining = new Date();

    const loginId = await generateLoginId(firstName, lastName, dateOfJoining, companyName);
    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      `INSERT INTO users (login_id, email, password_hash, role) VALUES (?, ?, ?, 'EMPLOYEE')`,
      [loginId, email, passwordHash]
    );
    const userId = userResult.insertId;

    const [empResult] = await connection.query(
      `INSERT INTO employees (user_id, first_name, last_name, phone, date_of_joining) VALUES (?, ?, ?, ?, ?)`,
      [userId, firstName, lastName, phone || null, dateOfJoining]
    );

    await initializeAllocations(empResult.insertId, connection);

    await connection.commit();
    res.status(201).json({ success: true, message: 'Registration successful', data: { login_id: loginId } });
  } catch (err) {
    await connection.rollback();
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

const login = async (req, res) => {
  try {
    const { loginIdOrEmail, password } = req.body;
    
    // Support both loginId (from tests) and loginIdOrEmail (from frontend)
    const identifier = loginIdOrEmail || req.body.loginId;
    
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Login ID and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE (email = ? OR login_id = ?) AND is_active = TRUE', [identifier, identifier]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const [employees] = await pool.query('SELECT id, profile_picture FROM employees WHERE user_id = ?', [user.id]);
    const employeeId = employees.length > 0 ? employees[0].id : null;
    const profilePicture = employees.length > 0 ? employees[0].profile_picture : null;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, employee_id: employeeId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { 
          id: user.id, 
          login_id: user.login_id, 
          email: user.email, 
          role: user.role, 
          employee_id: employeeId,
          profile_picture: profilePicture 
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, login_id, email, role FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const [employees] = await pool.query('SELECT id, profile_picture FROM employees WHERE user_id = ?', [req.user.id]);
    const employeeId = employees.length > 0 ? employees[0].id : null;
    const profilePicture = employees.length > 0 ? employees[0].profile_picture : null;

    res.json({ success: true, data: { ...rows[0], employee_id: employeeId, profile_picture: profilePicture } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect current password. Please try again.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    res.json({ success: true, message: 'Your password has been updated successfully.' });
  } catch (err) {
    console.error('CRITICAL: Change password error:', err);
    res.status(500).json({ success: false, error: 'Database error. Please contact system administrator.' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword
};
