require('dotenv').config();
const mysql = require('mysql2/promise');

async function fix() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await connection.query("ALTER TABLE payruns MODIFY COLUMN status ENUM('DRAFT', 'DONE', 'VALIDATED', 'CANCELLED') DEFAULT 'DRAFT'");
    console.log('Success: Updated payruns status enum');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

fix();
