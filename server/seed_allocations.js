require('dotenv').config();
const pool = require('./src/config/db');
const { initializeAllocations } = require('./src/services/timeOffService');

const seedAllocations = async () => {
  try {
    const [employees] = await pool.query('SELECT id FROM employees');
    console.log(`Found ${employees.length} employees. Initializing allocations...`);
    
    for (const emp of employees) {
      await initializeAllocations(emp.id);
    }
    
    console.log('Allocations initialized successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seed allocations failed:', err);
    process.exit(1);
  }
};

seedAllocations();
