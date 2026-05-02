const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateLoginId } = require('../services/idGenerator');

const getAllEmployees = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.first_name, e.last_name, e.department, e.job_position, e.profile_picture, 
              u.login_id, u.is_active, u.role, u.email,
              (SELECT status FROM attendances WHERE employee_id = e.id AND date = CURDATE()) as attendance_status,
              (SELECT status FROM time_off_requests WHERE employee_id = e.id AND CURDATE() BETWEEN start_date AND end_date AND status = 'APPROVED' LIMIT 1) as leave_status
       FROM employees e
       JOIN users u ON e.user_id = u.id`
    );
    
    const employees = rows.map(emp => ({
      ...emp,
      presence_status: emp.leave_status ? 'ON_LEAVE' : (emp.attendance_status ? 'PRESENT' : 'ABSENT')
    }));

    res.json({ success: true, data: employees });
  } catch (err) {
    console.error('GET employees error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [empRows] = await pool.query(
      `SELECT e.*, u.login_id, u.email, u.role, u.is_active 
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = ?`,
      [id]
    );

    if (empRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const employee = empRows[0];
    if (['ADMIN', 'PAYROLL_OFFICER'].includes(req.user.role)) {
      const [salaryRows] = await pool.query(
        `SELECT * FROM salary_structures WHERE employee_id = ? ORDER BY effective_from DESC LIMIT 1`,
        [id]
      );
      employee.salary_structure = salaryRows[0] || null;
    }

    res.json({ success: true, data: employee });
  } catch (err) {
    console.error('GET employee by id error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const createEmployee = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const data = req.body;
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [data.email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    const dateOfJoining = data.date_of_joining ? new Date(data.date_of_joining) : new Date();
    const loginId = await generateLoginId(data.first_name, data.last_name, dateOfJoining, process.env.COMPANY_NAME);
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const [userResult] = await connection.query(
      `INSERT INTO users (login_id, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [loginId, data.email, passwordHash, data.role || 'EMPLOYEE']
    );
    const userId = userResult.insertId;

    const [empResult] = await connection.query(
      `INSERT INTO employees (
        user_id, first_name, last_name, phone, department, job_position, 
        date_of_joining, manager_id, gender, marital_status, nationality,
        address, private_address, date_of_birth, place_of_birth, government_id,
        dependents, emergency_contact_name, emergency_contact_phone,
        bank_account_number, ifsc_code, bank_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, data.first_name, data.last_name, data.phone || null, data.department || null, 
        data.job_position || null, dateOfJoining, data.manager_id || null, data.gender || null, 
        data.marital_status || null, data.nationality || null, data.address || null,
        data.private_address || null, data.date_of_birth || null, data.place_of_birth || null,
        data.government_id || null, data.dependents || 0, data.emergency_contact_name || null,
        data.emergency_contact_phone || null, data.bank_account_number || null,
        data.ifsc_code || null, data.bank_name || null
      ]
    );

    await connection.commit();
    res.status(201).json({ 
      success: true, 
      message: 'Employee created', 
      data: { id: empResult.insertId, login_id: loginId, temp_password: tempPassword } 
    });
  } catch (err) {
    await connection.rollback();
    console.error('POST employee error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

const updateEmployee = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const data = req.body;
    await connection.beginTransaction();

    if (data.salary_structure && ['ADMIN', 'PAYROLL_OFFICER'].includes(req.user.role)) {
      const s = data.salary_structure;
      const [existing] = await connection.query('SELECT id FROM salary_structures WHERE employee_id = ?', [id]);
      if (existing.length > 0) {
        await connection.query(
          `UPDATE salary_structures SET 
            wage_type=?, monthly_wage=?, yearly_wage=?, hourly_rate=?, basic_pct=?, hra_pct=?, 
            standard_allowance=?, performance_bonus=?, travel_allowance=?, food_allowance=?, 
            pf_pct=?, professional_tax=?, effective_from=?
           WHERE employee_id=?`,
          [
            s.wage_type, s.monthly_wage, s.yearly_wage, s.hourly_rate || null, s.basic_pct, s.hra_pct,
            s.standard_allowance, s.performance_bonus, s.travel_allowance, s.food_allowance,
            s.pf_pct, s.professional_tax, s.effective_from || new Date(), id
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO salary_structures (
            employee_id, wage_type, monthly_wage, yearly_wage, hourly_rate, basic_pct, hra_pct,
            standard_allowance, performance_bonus, travel_allowance, food_allowance, pf_pct, 
            professional_tax, effective_from
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, s.wage_type, s.monthly_wage, s.yearly_wage, s.hourly_rate || null, s.basic_pct, s.hra_pct,
            s.standard_allowance, s.performance_bonus, s.travel_allowance, s.food_allowance,
            s.pf_pct, s.professional_tax, s.effective_from || new Date()
          ]
        );
      }
    }

    if (['ADMIN', 'HR_OFFICER'].includes(req.user.role)) {
      await connection.query(
        `UPDATE employees SET 
          first_name=?, last_name=?, phone=?, department=?, job_position=?, date_of_joining=?, 
          manager_id=?, gender=?, marital_status=?, nationality=?, address=?, private_address=?, 
          date_of_birth=?, place_of_birth=?, government_id=?, dependents=?, 
          emergency_contact_name=?, emergency_contact_phone=?, bank_account_number=?, 
          ifsc_code=?, bank_name=?, interests_hobbies=?, certifications=?
         WHERE id=?`,
        [
          data.first_name, data.last_name, data.phone, data.department, data.job_position,
          data.date_of_joining, data.manager_id, data.gender, data.marital_status, data.nationality,
          data.address, data.private_address, data.date_of_birth, data.place_of_birth,
          data.government_id, data.dependents, data.emergency_contact_name, data.emergency_contact_phone,
          data.bank_account_number, data.ifsc_code, data.bank_name, data.interests_hobbies, data.certifications, id
        ]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Employee updated' });
  } catch (err) {
    await connection.rollback();
    console.error('PUT employee error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const [emp] = await pool.query('SELECT user_id FROM employees WHERE id = ?', [id]);
    if (emp.length === 0) return res.status(404).json({ success: false, error: 'Employee not found' });
    await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [emp[0].user_id]);
    res.json({ success: true, message: 'Employee archived' });
  } catch (err) {
    console.error('DELETE employee error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
