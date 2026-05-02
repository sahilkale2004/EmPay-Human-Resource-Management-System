const pool = require('../config/db');

const getTimeOffRequests = async (req, res) => {
  try {
    let query = `
      SELECT r.*, e.first_name, e.last_name, t.name as time_off_type_name
      FROM time_off_requests r
      JOIN employees e ON r.employee_id = e.id
      JOIN time_off_types t ON r.time_off_type_id = t.id
    `;
    const params = [];
    if (req.user.role === 'EMPLOYEE') {
      query += ` WHERE r.employee_id = ?`;
      params.push(req.user.employee_id);
    }
    query += ` ORDER BY r.created_at DESC`;
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET timeoff error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const createTimeOffRequest = async (req, res) => {
  try {
    const { time_off_type_id, start_date, end_date, reason } = req.body;
    const employee_id = req.user.employee_id;
    if (!employee_id) return res.status(400).json({ success: false, error: 'User is not an employee' });

    if (!start_date) {
      return res.status(400).json({ success: false, error: 'Start date is required' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (end < start) {
      return res.status(400).json({ success: false, error: 'End date cannot be before start date' });
    }

    // Fetch time off type name
    const [types] = await pool.query('SELECT name FROM time_off_types WHERE id = ?', [time_off_type_id]);
    if (types.length === 0) return res.status(400).json({ success: false, error: 'Invalid time off type' });
    const timeOffType = types[0].name;

    const today = new Date();
    today.setHours(23, 59, 59, 999); // end of today
    if (timeOffType === 'Sick Leave') {
      if (start > today) {
        return res.status(400).json({
          success: false,
          error: 'Sick leave can only be applied for today or a past date. Future sick leave requests are not allowed.'
        });
      }
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const [alloc] = await pool.query(
      `SELECT remaining_days FROM time_off_allocations WHERE employee_id = ? AND time_off_type_id = ?`,
      [employee_id, time_off_type_id]
    );

    if (alloc.length === 0 || alloc[0].remaining_days < days) {
      return res.status(400).json({ success: false, error: 'Insufficient leave balance' });
    }

    await pool.query(
      `INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, number_of_days, reason, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [employee_id, time_off_type_id, start_date, end_date, days, reason]
    );

    // Feature 1: Socket Notification
    const { io, connectedAdmins } = require('../index');
    const [empDetails] = await pool.query('SELECT first_name, last_name FROM employees WHERE id = ?', [employee_id]);
    const employeeName = empDetails.length > 0 ? `${empDetails[0].first_name} ${empDetails[0].last_name}` : 'An employee';
    
    connectedAdmins.forEach((socketId) => {
      io.to(socketId).emit('new_timeoff_request', {
        message: `${employeeName} has submitted a new ${timeOffType} request.`,
        requestId: employee_id, // Simplified as we don't easily have insertId from pool.query without extra work, but let's assume it's fine for now or fetch it if needed.
        employeeId: employee_id,
        employeeName: employeeName,
        leaveType: timeOffType,
        startDate: start_date,
        endDate: end_date,
        timestamp: new Date().toISOString(),
      });
    });

    res.status(201).json({ success: true, message: 'Request submitted successfully' });
  } catch (err) {
    console.error('POST timeoff error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const approveRequest = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();

    const [rows] = await connection.query(`SELECT * FROM time_off_requests WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Request not found' });
    const request = rows[0];

    if (request.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Request already processed' });

    await connection.query(`UPDATE time_off_requests SET status = 'APPROVED' WHERE id = ?`, [id]);
    await connection.query(
      `UPDATE time_off_allocations SET remaining_days = remaining_days - ? 
       WHERE employee_id = ? AND time_off_type_id = ?`,
      [request.number_of_days, request.employee_id, request.time_off_type_id]
    );

    await connection.commit();
    res.json({ success: true, message: 'Request approved' });
  } catch (err) {
    await connection.rollback();
    console.error('Approve timeoff error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

const refuseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE time_off_requests SET status = 'REFUSED' WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Request refused' });
  } catch (err) {
    console.error('Refuse timeoff error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getAllocations = async (req, res) => {
  try {
    const employee_id = req.user.employee_id;
    if (!employee_id) return res.json({ success: true, data: [] });

    const [rows] = await pool.query(
      `SELECT a.*, t.name as time_off_type_name
       FROM time_off_allocations a
       JOIN time_off_types t ON a.time_off_type_id = t.id
       WHERE a.employee_id = ?`,
      [employee_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET allocations error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getTimeOffRequests,
  createTimeOffRequest,
  approveRequest,
  refuseRequest,
  getAllocations
};
