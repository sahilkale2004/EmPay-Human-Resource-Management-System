const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { generateLoginId } = require('../services/idGenerator');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { loginIdOrEmail, password } = req.body;
    
    if (!loginIdOrEmail || !password) {
      return res.status(400).json({ success: false, error: 'Login ID/Email and password are required' });
    }

    const [users] = await pool.query(
      `SELECT u.*, e.id as employee_id 
       FROM users u 
       LEFT JOIN employees e ON u.id = e.user_id 
       WHERE u.login_id = ? OR u.email = ?`,
      [loginIdOrEmail, loginIdOrEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = users[0];
    
    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account is inactive' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, employee_id: user.employee_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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
          employee_id: user.employee_id
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/register (Self-signup)
router.post('/register', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, email, phone, password } = req.body;
    
    // Basic validation
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

    const loginId = await generateLoginId(firstName, lastName, dateOfJoining);
    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      `INSERT INTO users (login_id, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [loginId, email, passwordHash, 'EMPLOYEE']
    );

    const userId = userResult.insertId;

    await connection.query(
      `INSERT INTO employees (user_id, first_name, last_name, phone, date_of_joining) VALUES (?, ?, ?, ?, ?)`,
      [userId, firstName, lastName, phone || null, dateOfJoining]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { login_id: loginId }
    });
  } catch (err) {
    await connection.rollback();
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Old and new passwords required' });
    }

    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ success: false, error: 'Incorrect old password' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Can be implemented by maintaining a token blacklist if needed.
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
