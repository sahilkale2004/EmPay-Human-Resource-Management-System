const pool = require('../config/db');

const generateLoginId = async (firstName, lastName, dateOfJoining) => {
  const companyCode = process.env.COMPANY_CODE || 'CC';
  
  // Format ZZZZ
  const fName = (firstName || '').replace(/[^a-zA-Z]/g, '').padEnd(2, 'X').substring(0, 2).toUpperCase();
  const lName = (lastName || '').replace(/[^a-zA-Z]/g, '').padEnd(2, 'X').substring(0, 2).toUpperCase();
  const zzzz = `${fName}${lName}`;
  
  // Format YYYY
  const dateObj = dateOfJoining ? new Date(dateOfJoining) : new Date();
  const yyyy = dateObj.getFullYear().toString();
  
  // Format NNNN
  const [rows] = await pool.query(
    `SELECT login_id FROM users WHERE login_id LIKE ? ORDER BY login_id DESC LIMIT 1`,
    [`%-${yyyy}-%`]
  );
  
  let serial = 1;
  if (rows.length > 0) {
    const lastId = rows[0].login_id;
    const parts = lastId.split('-');
    if (parts.length === 4) {
      const lastSerial = parseInt(parts[3], 10);
      if (!isNaN(lastSerial)) {
        serial = lastSerial + 1;
      }
    }
  }
  
  const nnnn = serial.toString().padStart(4, '0');
  
  return `${companyCode}-${zzzz}-${yyyy}-${nnnn}`;
};

module.exports = {
  generateLoginId
};
