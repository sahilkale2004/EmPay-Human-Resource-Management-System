const pool = require('../config/db');

const initializeAllocations = async (employeeId, connection = null) => {
  const db = connection || pool;
  try {
    const [types] = await db.query('SELECT id FROM time_off_types');
    for (const type of types) {
      await db.query(
        `INSERT IGNORE INTO time_off_allocations (employee_id, time_off_type_id, validity_start, validity_end, allocated_days, remaining_days) 
         VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 20, 20)`,
        [employeeId, type.id]
      );
    }
  } catch (err) {
    console.error('Error initializing allocations:', err);
    throw err;
  }
};

module.exports = {
  initializeAllocations
};
