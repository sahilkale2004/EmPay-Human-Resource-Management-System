USE empay;

-- Clear tables (reverse order of dependencies)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payslips;
TRUNCATE TABLE payruns;
TRUNCATE TABLE time_off_requests;
TRUNCATE TABLE time_off_allocations;
TRUNCATE TABLE time_off_types;
TRUNCATE TABLE attendances;
TRUNCATE TABLE salary_structures;
TRUNCATE TABLE employees;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert TimeOffTypes
INSERT INTO time_off_types (id, name, is_paid) VALUES
(1, 'Paid Time Off', TRUE),
(2, 'Sick Leave', TRUE),
(3, 'Unpaid Leave', FALSE);

-- Pre-hashed password for 'password123'
-- Hash generated via bcrypt: $2a$10$w81.6m4rX0p6hP0QYcR1yO/4.lX34ZJ.J2f4jQJ68s8Z5J8fXm
SET @password = '$2a$10$w81.6m4rX0p6hP0QYcR1yO/4.lX34ZJ.J2f4jQJ68s8Z5J8fXm';
SET @curr_year = YEAR(CURDATE());

-- 2. Insert Users
INSERT INTO users (id, login_id, email, password_hash, role) VALUES
(1, CONCAT('OD-ADMI-', @curr_year, '-0001'), 'admin@empay.local', @password, 'ADMIN'),
(2, CONCAT('OD-HROF-', @curr_year, '-0002'), 'hr@empay.local', @password, 'HR_OFFICER'),
(3, CONCAT('OD-PAOF-', @curr_year, '-0003'), 'payroll@empay.local', @password, 'PAYROLL_OFFICER'),
(4, CONCAT('OD-EMON-', @curr_year, '-0004'), 'employee1@empay.local', @password, 'EMPLOYEE'),
(5, CONCAT('OD-EMTW-', @curr_year, '-0005'), 'employee2@empay.local', @password, 'EMPLOYEE');

-- 3. Insert Employees
INSERT INTO employees (id, user_id, first_name, last_name, department, job_position, date_of_joining, manager_id, bank_account_number, ifsc_code, bank_name) VALUES
(1, 1, 'Admin', 'User', 'Management', 'System Administrator', CURDATE(), NULL, NULL, NULL, NULL),
(2, 2, 'HR', 'Officer', 'Human Resources', 'HR Manager', CURDATE(), NULL, NULL, NULL, NULL),
(3, 3, 'Payroll', 'Officer', 'Finance', 'Payroll Specialist', CURDATE(), NULL, NULL, NULL, NULL),
(4, 4, 'Employee', 'One', 'Engineering', 'Software Engineer', '2024-01-15', 2, '1234567890', 'HDFC0001234', 'HDFC Bank'),
(5, 5, 'Employee', 'Two', 'Sales', 'Sales Representative', '2024-03-01', NULL, NULL, NULL, NULL);

-- 4. Insert Salary Structures
INSERT INTO salary_structures (employee_id, wage_type, monthly_wage, yearly_wage, basic_pct, hra_pct, standard_allowance, performance_bonus, pf_pct, professional_tax, effective_from) VALUES
(4, 'MONTHLY', 100000.00, 1200000.00, 40.00, 50.00, 20000.00, 5000.00, 12.00, 200.00, '2024-01-15'),
(5, 'MONTHLY', 60000.00, 720000.00, 40.00, 50.00, 15000.00, 3000.00, 12.00, 200.00, '2024-03-01');
