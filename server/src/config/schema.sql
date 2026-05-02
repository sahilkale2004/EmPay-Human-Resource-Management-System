CREATE DATABASE IF NOT EXISTS empay;
USE empay;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  login_id VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE') DEFAULT 'EMPLOYEE',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100),
  job_position VARCHAR(100),
  date_of_joining DATE,
  manager_id INT,
  profile_picture VARCHAR(255),
  address TEXT,
  gender VARCHAR(20),
  marital_status VARCHAR(50),
  nationality VARCHAR(100),
  interests_hobbies TEXT,
  certifications TEXT,
  bank_account_number VARCHAR(50),
  ifsc_code VARCHAR(20),
  bank_name VARCHAR(100),
  
  private_address TEXT,
  date_of_birth DATE,
  place_of_birth VARCHAR(100),
  government_id VARCHAR(50),
  dependents INT DEFAULT 0,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS salary_structures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  wage_type ENUM('MONTHLY', 'HOURLY') DEFAULT 'MONTHLY',
  monthly_wage DECIMAL(10, 2) NOT NULL,
  yearly_wage DECIMAL(10, 2) NOT NULL,
  hourly_rate DECIMAL(10, 2),
  basic_pct DECIMAL(5, 2) DEFAULT 40.00,
  hra_pct DECIMAL(5, 2) DEFAULT 50.00,
  standard_allowance DECIMAL(10, 2) DEFAULT 0.00,
  performance_bonus DECIMAL(10, 2) DEFAULT 0.00,
  travel_allowance DECIMAL(10, 2) DEFAULT 0.00,
  food_allowance DECIMAL(10, 2) DEFAULT 0.00,
  pf_pct DECIMAL(5, 2) DEFAULT 12.00,
  professional_tax DECIMAL(10, 2) DEFAULT 200.00,
  effective_from DATE NOT NULL,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  check_in DATETIME NOT NULL,
  check_out DATETIME,
  work_hours DECIMAL(5, 2),
  overtime_hours DECIMAL(5, 2) DEFAULT 0.00,
  status ENUM('PRESENT', 'ABSENT', 'ON_LEAVE', 'HALF_DAY') DEFAULT 'PRESENT',

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_employee_date (employee_id, date)
);

CREATE TABLE IF NOT EXISTS time_off_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  is_paid BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS time_off_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  time_off_type_id INT NOT NULL,
  validity_start DATE NOT NULL,
  validity_end DATE NOT NULL,
  allocated_days DECIMAL(5, 2) NOT NULL,
  remaining_days DECIMAL(5, 2) NOT NULL,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (time_off_type_id) REFERENCES time_off_types(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS time_off_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  time_off_type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_days DECIMAL(5, 2) NOT NULL,
  reason TEXT,
  attachment VARCHAR(255),
  status ENUM('PENDING', 'APPROVED', 'REFUSED') DEFAULT 'PENDING',
  approved_by INT,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (time_off_type_id) REFERENCES time_off_types(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payruns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status ENUM('DRAFT', 'VALIDATED', 'CANCELLED') DEFAULT 'DRAFT',
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payslips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payrun_id INT NOT NULL,
  employee_id INT NOT NULL,
  salary_structure_id INT NOT NULL,
  
  pay_period VARCHAR(100) NOT NULL,
  worked_days DECIMAL(5, 2) NOT NULL,
  paid_leave_days DECIMAL(5, 2) NOT NULL,
  
  basic_salary DECIMAL(10, 2) NOT NULL,
  hra DECIMAL(10, 2) NOT NULL,
  standard_allowance DECIMAL(10, 2) NOT NULL,
  performance_bonus DECIMAL(10, 2) NOT NULL,
  travel_allowance DECIMAL(10, 2) NOT NULL,
  food_allowance DECIMAL(10, 2) NOT NULL,
  gross_wage DECIMAL(10, 2) NOT NULL,
  
  pf_employee DECIMAL(10, 2) NOT NULL,
  pf_employer DECIMAL(10, 2) NOT NULL,
  professional_tax DECIMAL(10, 2) NOT NULL,
  total_deductions DECIMAL(10, 2) NOT NULL,
  
  net_payable DECIMAL(10, 2) NOT NULL,
  status ENUM('DRAFT', 'DONE', 'CANCELLED') DEFAULT 'DRAFT',
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (payrun_id) REFERENCES payruns(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT
);
