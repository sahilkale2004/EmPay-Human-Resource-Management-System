-- EmPay Seed Data (Clean Version - Admin Only)
USE empay;

-- 1. Insert Admin User
-- Password is 'password123' hashed with bcrypt (10 rounds)
INSERT INTO users (login_id, email, password_hash, role, is_active) 
VALUES ('ADMIN001', 'admin@empay.local', '$2b$10$7vN3.XhB3K.q/S3qU.6KneYm1J1m9.fX8x7XG1fW1y.H6fF8XG7XG', 'ADMIN', TRUE);

-- 2. Insert Admin Employee Profile
INSERT INTO employees (user_id, first_name, last_name, department, job_position, date_of_joining)
SELECT id, 'System', 'Administrator', 'IT', 'Administrator', CURDATE() FROM users WHERE email = 'admin@empay.local';

-- 3. Insert Default Time Off Types
INSERT INTO time_off_types (name, is_paid) VALUES 
('Paid Time Off (PTO)', TRUE),
('Sick Leave', TRUE),
('Unpaid Leave', FALSE);
