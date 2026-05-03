const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Riyan', 'Diya', 'Ananya', 'Myra', 'Aaradhya', 'Kiara', 'Ira', 'Avni', 'Saanvi', 'Kavya', 'Riya', 'Mira', 'Sara', 'Neha', 'Pooja', 'Rahul', 'Amit', 'Vikram', 'Ravi', 'Sanjay', 'Sunil', 'Karan', 'Priya', 'Sneha', 'Anita', 'Kiran'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Das', 'Bose', 'Nair', 'Reddy', 'Rao', 'Iyer', 'Pillai', 'Menon', 'Jain', 'Shah', 'Agarwal', 'Mehta', 'Desai', 'Joshi', 'Bhatt', 'Mishra', 'Pandey', 'Dubey', 'Tiwari', 'Chauhan', 'Rajput', 'Yadav', 'Kaur', 'Chaudhary'];
const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Finance', 'Operations', 'Customer Support', 'Design'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomPhone() {
  return '+91 ' + Math.floor(9000000000 + Math.random() * 1000000000);
}

function generateRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

async function seed() {
  try {
    console.log('Connecting to database to seed 300 users...');
    const passwordHash = await bcrypt.hash('password123', 10);
    let hrCount = 0;
    let employeeCount = 0;

    for (let i = 1; i <= 300; i++) {
      const isHR = hrCount < 10;
      const role = isHR ? 'HR_OFFICER' : 'EMPLOYEE';
      if (isHR) hrCount++; else employeeCount++;
      
      const loginId = isHR ? `EMP-HR-${Date.now()}-${i}` : `EMP-${Date.now()}-${i}`;
      
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.com`;
      const phone = generateRandomPhone();
      const hireDate = generateRandomDate(new Date(2020, 0, 1), new Date(2026, 0, 1));
      const dob = generateRandomDate(new Date(1980, 0, 1), new Date(2000, 0, 1));
      const department = isHR ? 'Human Resources' : getRandomElement(DEPARTMENTS);
      const jobPosition = isHR ? 'HR Manager' : 'Staff';
      const gender = Math.random() > 0.5 ? 'Male' : 'Female';

      // Insert User
      const [userResult] = await pool.query(
        'INSERT INTO users (login_id, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
        [loginId, email, passwordHash, role, true]
      );
      const userId = userResult.insertId;

      // Insert Employee
      const [employeeResult] = await pool.query(
        `INSERT INTO employees 
        (user_id, first_name, last_name, phone, date_of_birth, gender, date_of_joining, department, job_position) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, firstName, lastName, phone, dob, gender, hireDate, department, jobPosition]
      );
      const employeeId = employeeResult.insertId;

      // Initialize salary structure
      await pool.query(
        `INSERT INTO salary_structures 
        (employee_id, basic_pct, monthly_wage, yearly_wage, hra_pct, pf_pct, professional_tax, effective_from) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [employeeId, 40, 50000, 600000, 20, 12, 200, hireDate]
      );

      if (i % 50 === 0) console.log(`Inserted ${i} records...`);
    }

    console.log(`Successfully seeded ${hrCount} HR and ${employeeCount} Employees!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
