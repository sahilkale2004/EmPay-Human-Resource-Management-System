const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await conn.query(`ALTER TABLE payruns MODIFY COLUMN status ENUM('DRAFT', 'DONE', 'VALIDATED', 'CANCELLED') DEFAULT 'DRAFT'`);
    console.log('Altered payruns table status ENUM');
  } catch (err) {
    console.error('Error altering table:', err);
  } finally {
    await conn.end();
  }
})();
