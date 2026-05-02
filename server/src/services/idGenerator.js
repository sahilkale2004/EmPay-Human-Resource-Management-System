const pool = require('../config/db');

/**
 * Format: [OI][JODO][2022][0001]
 * OI -> Company Initials
 * JODO -> First two letters of First Name + First two letters of Last Name
 * 2022 -> Year of Joining
 * 0001 -> Serial Number
 */
const generateLoginId = async (firstName, lastName, dateOfJoining, companyName = 'EmPay') => {
  const oi = companyName.replace(/[^a-zA-Z]/g, '').padEnd(2, 'X').substring(0, 2).toUpperCase();
  
  const fName = (firstName || '').replace(/[^a-zA-Z]/g, '').padEnd(2, 'X').substring(0, 2).toUpperCase();
  const lName = (lastName || '').replace(/[^a-zA-Z]/g, '').padEnd(2, 'X').substring(0, 2).toUpperCase();
  const jodo = `${fName}${lName}`;
  
  const dateObj = dateOfJoining ? new Date(dateOfJoining) : new Date();
  const year = dateObj.getFullYear().toString();
  
  // Search for IDs matching this year's prefix
  const prefix = `${oi}${jodo}${year}`;
  const [rows] = await pool.query(
    `SELECT login_id FROM users WHERE login_id LIKE ? ORDER BY login_id DESC LIMIT 1`,
    [`${prefix}%`]
  );
  
  let serial = 1;
  if (rows.length > 0) {
    const lastId = rows[0].login_id;
    // The serial is the last 4 digits
    const lastSerialStr = lastId.substring(lastId.length - 4);
    const lastSerial = parseInt(lastSerialStr, 10);
    if (!isNaN(lastSerial)) {
      serial = lastSerial + 1;
    }
  }
  
  const nnnn = serial.toString().padStart(4, '0');
  
  return `${oi}${jodo}${year}${nnnn}`;
};

module.exports = {
  generateLoginId
};
