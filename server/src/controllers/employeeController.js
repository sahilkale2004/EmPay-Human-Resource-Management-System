const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateLoginId } = require('../services/idGenerator');
const { initializeAllocations } = require('../services/timeOffService');
const { toMySQLDate, formatDateFields } = require('../utils/formatDate');

const getAllEmployees = async (req, res) => {
  try {
    let query = `SELECT e.*, 
                        u.login_id, u.is_active, u.role, u.email,
                        (SELECT status FROM attendances WHERE employee_id = e.id AND date = CURDATE()) as attendance_status,
                        (SELECT status FROM time_off_requests WHERE employee_id = e.id AND CURDATE() BETWEEN start_date AND end_date AND status = 'APPROVED' LIMIT 1) as leave_status
                 FROM employees e
                 JOIN users u ON e.user_id = u.id`;
    
    const queryParams = [];
    
    // Default filter: only active users
    query += ` WHERE u.is_active = TRUE`;
    
    // If the requester is just an EMPLOYEE, only show other EMPLOYEES
    if (req.user.role === 'EMPLOYEE') {
      query += ` AND u.role = 'EMPLOYEE'`;
    }

    const [rows] = await pool.query(query, queryParams);
    
    const employees = rows.map(emp => {
      const formatted = formatDateFields(emp, ['date_of_joining', 'date_of_birth', 'created_at']);
      return {
        ...formatted,
        presence_status: emp.leave_status ? 'ON_LEAVE' : (emp.attendance_status ? 'PRESENT' : 'ABSENT')
      };
    });

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

    let employee = empRows[0];
    employee = formatDateFields(employee, ['date_of_joining', 'date_of_birth', 'created_at']);

    if (['ADMIN', 'PAYROLL_OFFICER'].includes(req.user.role)) {
      const [salaryRows] = await pool.query(
        `SELECT * FROM salary_structures WHERE employee_id = ? ORDER BY effective_from DESC LIMIT 1`,
        [id]
      );
      if (salaryRows[0]) {
        employee.salary_structure = formatDateFields(salaryRows[0], ['effective_from', 'created_at']);
      } else {
        employee.salary_structure = null;
      }
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
    const tempPassword = data.password || Math.random().toString(36).slice(-8);
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
        data.job_position || null, toMySQLDate(dateOfJoining), data.manager_id || null, data.gender || null, 
        data.marital_status || null, data.nationality || null, data.address || null,
        data.private_address || null, toMySQLDate(data.date_of_birth), data.place_of_birth || null,
        data.government_id || null, data.dependents || 0, data.emergency_contact_name || null,
        data.emergency_contact_phone || null, data.bank_account_number || null,
        data.ifsc_code || null, data.bank_name || null
      ]
    );

    await initializeAllocations(empResult.insertId, connection);

    await connection.commit();

    const newEmployee = {
      id: empResult.insertId,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      login_id: loginId
    };

    const { sendWelcomeEmail } = require('../services/emailService');
    sendWelcomeEmail(newEmployee, tempPassword);

    const { io, connectedAdmins } = require('../index');
    connectedAdmins.forEach((socketId) => {
      io.to(socketId).emit('new_employee', {
        message: `New employee ${data.first_name} ${data.last_name} has been added.`,
        employeeId: empResult.insertId,
        timestamp: new Date().toISOString(),
      });
    });

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
    const isAdminOrHR = ['ADMIN', 'HR_OFFICER'].includes(req.user.role);
    const isSelf = parseInt(id) === parseInt(req.user.employee_id);

    if (!isAdminOrHR && !isSelf) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only update your own profile.' });
    }

    await connection.beginTransaction();

    if (isAdminOrHR && data.role) {
      await connection.query('UPDATE users u JOIN employees e ON e.user_id = u.id SET u.role = ? WHERE e.id = ?', [data.role, id]);
    }

    // Feature 6: Restrict Admin/HR from editing private info of others
    const privateFields = [
      'date_of_birth', 'place_of_birth', 'government_id', 
      'emergency_contact_name', 'emergency_contact_phone', 'dependents'
    ];
    
    if (!isSelf && isAdminOrHR) {
      const attemptedPrivate = privateFields.filter(f => data[f] !== undefined);
      if (attemptedPrivate.length > 0) {
        return res.status(403).json({ success: false, error: 'Forbidden: Private information can only be edited by the employee.' });
      }
    }

    const fields = [];
    const values = [];

    const selfEditableFields = [
      'first_name', 'last_name', 'phone', 'address', 'gender', 'marital_status', 
      'nationality', 'interests_hobbies', 'certifications',
      'bank_account_number', 'ifsc_code', 'bank_name', 'private_address',
      'date_of_birth', 'place_of_birth', 'government_id', 'dependents',
      'emergency_contact_name', 'emergency_contact_phone'
    ];

    const adminOnlyFields = [
      'department', 'job_position', 'date_of_joining', 'manager_id'
    ];

    const dateFields = ['date_of_joining', 'date_of_birth'];

    selfEditableFields.forEach(f => {
      if (data[f] !== undefined) {
        fields.push(`${f} = ?`);
        values.push(dateFields.includes(f) ? toMySQLDate(data[f]) : data[f]);
      }
    });

    if (isAdminOrHR) {
      adminOnlyFields.forEach(f => {
        if (data[f] !== undefined) {
          fields.push(`${f} = ?`);
          values.push(dateFields.includes(f) ? toMySQLDate(data[f]) : data[f]);
        }
      });
    }

    if (req.file) {
      const profilePicPath = `/uploads/avatars/${req.file.filename}`;
      fields.push(`profile_picture = ?`);
      values.push(profilePicPath);
    }

    if (fields.length > 0) {
      values.push(id);
      await connection.query(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    await connection.commit();

    const [updated] = await connection.query(
      `SELECT e.*, u.login_id, u.email, u.role, u.is_active 
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = ?`,
      [id]
    );

    let employee = updated[0];
    employee = formatDateFields(employee, ['date_of_joining', 'date_of_birth', 'created_at']);

    res.json({ success: true, message: 'Employee updated', data: employee });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('PUT employee error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
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

const getSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM salary_structures WHERE employee_id = ? ORDER BY effective_from DESC LIMIT 1',
      [id]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('GET salary error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const saveSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const s = req.body;
    
    if (!['ADMIN', 'PAYROLL_OFFICER'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: Only Admin or Payroll Officer can edit salary.' });
    }

    if (!s.monthly_wage || s.monthly_wage <= 0) {
      return res.status(400).json({ success: false, error: 'Monthly wage must be a positive number' });
    }

    const totalPct = (Number(s.basic_pct) || 0) + (Number(s.hra_pct) || 0) + (Number(s.standard_allowance_pct) || 0) + 
                     (Number(s.performance_bonus_pct) || 0) + (Number(s.travel_allowance_pct) || 0) + (Number(s.food_allowance_pct) || 0);
    
    if (totalPct > 100) {
      return res.status(400).json({ success: false, error: 'Total components exceed 100% of gross wage' });
    }

    const monthlyWage = Number(s.monthly_wage);
    const yearlyWage = monthlyWage * 12;
    const basicAmount = monthlyWage * (Number(s.basic_pct) / 100);
    const hraAmount = basicAmount * (Number(s.hra_pct) / 100);
    const stdAmount = monthlyWage * (Number(s.standard_allowance_pct) / 100);
    const perfAmount = monthlyWage * (Number(s.performance_bonus_pct) / 100);
    const travelAmount = monthlyWage * (Number(s.travel_allowance_pct) / 100);
    const foodAmount = monthlyWage * (Number(s.food_allowance_pct) / 100);
    const pfAmount = basicAmount * (Number(s.pf_pct || 12) / 100);

    const [existing] = await pool.query('SELECT id FROM salary_structures WHERE employee_id = ?', [id]);
    
    if (existing.length > 0) {
      await pool.query(
        `UPDATE salary_structures SET 
          wage_type=?, monthly_wage=?, yearly_wage=?, basic_pct=?, hra_pct=?, 
          standard_allowance=?, performance_bonus=?, travel_allowance=?, food_allowance=?, 
          pf_pct=?, professional_tax=?, effective_from=?
         WHERE employee_id=?`,
        [
          s.wage_type, monthlyWage, yearlyWage, s.basic_pct, s.hra_pct,
          stdAmount, perfAmount, travelAmount, foodAmount,
          s.pf_pct || 12, s.professional_tax || 200, toMySQLDate(s.effective_from || new Date()), id
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO salary_structures (
          employee_id, wage_type, monthly_wage, yearly_wage, basic_pct, hra_pct,
          standard_allowance, performance_bonus, travel_allowance, food_allowance, pf_pct, 
          professional_tax, effective_from
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, s.wage_type, monthlyWage, yearlyWage, s.basic_pct, s.hra_pct,
          stdAmount, perfAmount, travelAmount, foodAmount,
          s.pf_pct || 12, s.professional_tax || 200, toMySQLDate(s.effective_from || new Date())
        ]
      );
    }

    const [updated] = await pool.query('SELECT * FROM salary_structures WHERE employee_id = ?', [id]);
    res.json({ success: true, message: 'Salary structure saved', data: updated[0] });
  } catch (err) {
    console.error('SAVE salary error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getSalary,
  saveSalary
};
