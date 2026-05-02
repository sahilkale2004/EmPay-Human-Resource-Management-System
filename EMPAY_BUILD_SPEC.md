# EmPay – Smart Human Resource Management System
## Complete Build Specification for Code Editor / AI Agent

---

## 1. PROJECT OVERVIEW

**EmPay** is a full-stack Human Resource Management System (HRMS) designed for startups, institutions, and SMEs. It covers employee management, attendance tracking, leave (time-off) management, payroll processing, and analytics — all from a single unified interface.

### Tech Stack Recommendation
- **Frontend:** React (with React Router), Tailwind CSS, Recharts (for analytics)
- **Backend:** Node.js + Express (or Django / FastAPI)
- **Database:** PostgreSQL (preferred) or SQLite for local/offline
- **Auth:** JWT-based authentication with role-based access control (RBAC)
- **PDF Generation:** jsPDF or Puppeteer (for payslips)
- **Version Control:** Git (meaningful commits required)

> **Must-Have Constraints:**
> - Use real-time or dynamic data sources (no hard-coded static JSON in production)
> - Responsive and clean UI with a consistent color scheme and layout
> - Robust input validation on all forms
> - Intuitive navigation with proper menu placement
> - Version control with Git (multiple contributors)

---

## 2. ROLES & PERMISSIONS

There are **4 roles** in the system. Every API endpoint and UI route must enforce these permissions.

| Permission Area        | Admin | HR Officer | Payroll Officer | Employee |
|------------------------|:-----:|:----------:|:---------------:|:--------:|
| Manage Users & Roles   | ✅    | ❌         | ❌              | ❌       |
| Create/Edit Employees  | ✅    | ✅         | ❌              | ❌       |
| View All Employees     | ✅    | ✅         | ✅              | ✅ (read-only) |
| Attendance – View All  | ✅    | ✅         | ✅              | ❌ (own only) |
| Attendance – Mark Own  | ✅    | ✅         | ✅              | ✅       |
| Leave – Apply          | ✅    | ✅         | ✅              | ✅       |
| Leave – Approve/Reject | ✅    | ✅         | ✅              | ❌       |
| Leave – Allocate       | ✅    | ✅         | ❌              | ❌       |
| Payroll – View/Generate| ✅    | ❌         | ✅              | ❌       |
| Payslip – View Own     | ✅    | ✅         | ✅              | ✅       |
| Salary Info – Edit     | ✅    | ❌         | ✅              | ❌       |
| Reports                | ✅    | ❌         | ✅              | ❌       |
| System Settings        | ✅    | ❌         | ❌              | ❌       |

---

## 3. DATA MODELS

### 3.1 User / Employee
```
User {
  id               UUID (PK)
  login_id         String (auto-generated, format: CC-ZZZZ-YYYY-NNNN)
  email            String (unique)
  password_hash    String
  role             Enum: ADMIN | HR_OFFICER | PAYROLL_OFFICER | EMPLOYEE
  is_active        Boolean
  created_at       DateTime
}

Employee {
  id               UUID (PK)
  user_id          UUID (FK → User)
  first_name       String
  last_name        String
  phone            String
  department       String
  job_position     String
  date_of_joining  Date
  manager_id       UUID (FK → Employee, nullable)
  profile_picture  String (URL/path)
  address          Text
  gender           String
  marital_status   String
  nationality      String
  interests_hobbies Text
  certifications   Text
  bank_account_number String
  ifsc_code        String
  bank_name        String
}
```

**Login ID Format:**
`CC-ZZZZ-YYYY-NNNN`
- `CC` = First 2 letters of company name
- `ZZZZ` = First two letters of employee's first name + last name
- `YYYY` = Year of joining
- `NNNN` = Serial number of joining for that year

*Example:* OD-KSJO-2024-0001 (Odoo company, Kshitij Joshi, joined 2024, 1st employee)

### 3.2 Salary / Wage Structure
```
SalaryStructure {
  id               UUID (PK)
  employee_id      UUID (FK → Employee)
  wage_type        Enum: MONTHLY | HOURLY
  monthly_wage     Decimal
  yearly_wage      Decimal (auto-calculated)
  hourly_rate      Decimal (if wage_type = HOURLY)
  basic_pct        Decimal (% of gross, default 40%)
  hra_pct          Decimal (% of basic)
  standard_allowance Decimal
  performance_bonus Decimal
  travel_allowance Decimal
  food_allowance   Decimal
  pf_pct           Decimal (default 12% of basic)
  professional_tax Decimal (fixed monthly, e.g. ₹200)
  effective_from   Date
}
```

**Salary Calculation Rules:**
- `Gross Wage = Monthly Wage`
- `Basic = gross * basic_pct / 100`
- `HRA = basic * hra_pct / 100`
- `PF (Employee) = basic * 12% / 100`
- `PF (Employer) = basic * 12% / 100`
- `Net Pay = Gross - PF(employee) - Professional Tax`
- All allowance percentages are relative to `gross wage`
- Total of all components must NOT exceed the defined gross wage

### 3.3 Attendance
```
Attendance {
  id               UUID (PK)
  employee_id      UUID (FK → Employee)
  date             Date
  check_in         DateTime
  check_out        DateTime (nullable)
  work_hours       Decimal (auto-calculated)
  overtime_hours   Decimal
  status           Enum: PRESENT | ABSENT | ON_LEAVE | HALF_DAY
}
```

**Attendance Rules:**
- Status indicator colors:
  - 🟢 Green dot = Employee is present in office (checked in, not checked out)
  - 🔴 Red dot = Employee is on leave (approved time-off)
  - 🟡 Yellow dot = Employee is absent (no time-off applied and absent)
- Attendance data drives payroll calculation
- Approved leaves do NOT reduce payable days (they count as worked days)
- Any unapproved absent days reduce payable days during payroll computation
- The system should use attendance to determine total payable days per employee

### 3.4 Time Off (Leave)
```
TimeOffType {
  id               UUID (PK)
  name             String (e.g., Paid Time Off, Sick Leave, Unpaid Leave)
  is_paid          Boolean
}

TimeOffAllocation {
  id               UUID (PK)
  employee_id      UUID (FK → Employee)
  time_off_type_id UUID (FK → TimeOffType)
  validity_start   Date
  validity_end     Date
  allocated_days   Decimal
  remaining_days   Decimal
}

TimeOffRequest {
  id               UUID (PK)
  employee_id      UUID (FK → Employee)
  time_off_type_id UUID (FK → TimeOffType)
  start_date       Date
  end_date         Date
  number_of_days   Decimal (auto-calculated)
  reason           Text
  attachment       String (file URL, optional)
  status           Enum: PENDING | APPROVED | REFUSED
  approved_by      UUID (FK → User, nullable)
  approved_at      DateTime (nullable)
  created_at       DateTime
}
```

**Time-Off Types (defaults to seed):**
1. Paid Time Off
2. Sick Leave
3. Unpaid Leave

### 3.5 Payroll
```
Payrun {
  id               UUID (PK)
  name             String (e.g., "Payrun Oct 2025")
  period_start     Date
  period_end       Date
  status           Enum: DRAFT | VALIDATED | CANCELLED
  created_by       UUID (FK → User)
  created_at       DateTime
}

Payslip {
  id               UUID (PK)
  payrun_id        UUID (FK → Payrun)
  employee_id      UUID (FK → Employee)
  salary_structure_id UUID (FK → SalaryStructure)
  
  -- Computed fields (stored at time of generation)
  pay_period       String (e.g., "01 Oct To 31 Oct")
  worked_days      Decimal
  paid_leave_days  Decimal
  
  -- Earnings
  basic_salary     Decimal
  hra              Decimal
  standard_allowance Decimal
  performance_bonus Decimal
  travel_allowance Decimal
  food_allowance   Decimal
  gross_wage       Decimal
  
  -- Deductions
  pf_employee      Decimal
  pf_employer      Decimal
  professional_tax Decimal
  total_deductions Decimal
  
  net_payable      Decimal
  status           Enum: DRAFT | DONE | CANCELLED
  generated_at     DateTime
}
```

### 3.6 Reports
```
SalaryStatementReport {
  employee_id   UUID
  year          Integer
  -- Aggregated monthly data for all 12 months
}
```

---

## 4. AUTHENTICATION & NAVIGATION

### 4.1 Login Page (`/login`)
**Fields:**
- Login ID / Email (text input) — label: "Login ID/Email"
- Password (password input)
- "Sign In" button
- Link: "Don't have an account? Sign Up"

**Behavior:**
- On success → redirect to Dashboard
- Current user's Login ID should be auto-populated if remembered
- Show validation errors inline

### 4.2 Sign Up / Registration Page (`/signup`)
**Fields:**
- Name (text)
- Email (email)
- Phone (tel)
- Password (password)
- Confirm Password (password)
- Upload Logo (file upload, optional for company)
- "Sign Up" button / "Already have an account? Sign In" link

**Behavior:**
- When an HR Officer or Admin creates a new employee account, the system auto-generates the Login ID and a temporary password
- The new user receives an email with their Login ID and password
- The system-generated Login ID follows the format: `CC-ZZZZ-YYYY-NNNN`

### 4.3 Sidebar Navigation
The main layout has a **left sidebar** with the company logo/name at the top and navigation links. Active link is highlighted.

**Sidebar items (vary by role):**

| Nav Item    | Admin | HR Officer | Payroll Officer | Employee |
|-------------|:-----:|:----------:|:---------------:|:--------:|
| Dashboard   | ✅    | ✅         | ✅              | ✅       |
| Employees   | ✅    | ✅         | ✅              | ✅       |
| Attendance  | ✅    | ✅         | ✅              | ✅       |
| Time Off    | ✅    | ✅         | ✅              | ✅       |
| Payroll     | ✅    | ❌         | ✅              | ❌       |
| Reports     | ✅    | ❌         | ✅              | ❌       |
| Settings    | ✅    | ❌         | ❌              | ❌       |

### 4.4 Top Bar / Header
- Company name + "Logo" on the left
- Red circle (notifications) and a minimize/close window button on the right
- **User Avatar (top-right):** Clicking it opens a dropdown with:
  - "My Profile" → opens employee profile in form/edit view
  - "Log Out" → clears session and redirects to login

---

## 5. SCREENS & COMPONENTS

---

### 5.1 DASHBOARD (`/dashboard`)

**All Roles see a dashboard — content varies by role.**

#### Admin Dashboard
- **Employee Cards Section:** Grid of employee cards. Each card shows:
  - Profile picture
  - Name
  - Status indicator dot (Green = present, Red = on leave, Yellow = absent)
  - Clicking a card → opens employee info page in non-editable mode (initially)
- **Payroll Summary Widget:** Shows current month payrun, warnings for:
  - Employees without a bank account
  - Employees without a manager
  - Links to current and previous payruns
- **Employee Count Chart:** Monthly bar chart (employees with salary, employees without salary)
- **Payrun Trend Chart:** Monthly bar chart for Jan–Mar (or current quarter)

#### Employee Dashboard
Shows personal:
- Attendance summary
- Leave balances
- Upcoming payslip info

#### HR Officer Dashboard
- Employee grid with status dots
- Attendance overview

#### Payroll Officer Dashboard
- Payroll/payrun widgets
- Pending time-off approvals count

**Check In / Check Out Component (visible to all on Dashboard or Attendance):**
- "Check In →" button
- "Check Out →" button (active after check-in)
- Upon successful Check In → the red status dot changes to green
- Show current date/time

---

### 5.2 EMPLOYEES MODULE

#### 5.2.1 Employee List (`/employees`)
- **Table/Grid view** of all employees
- Columns: Profile Picture, Name, Login ID, Job Position, Department, Status
- **Search bar** (filter by name, department, etc.)
- **"New" button** (Admin / HR Officer only) → opens Create Employee form
- Clicking an employee row → opens Employee Detail/Profile view

#### 5.2.2 Employee Profile / Detail View (`/employees/:id`)
This is a **tabbed form** with 4 tabs:

**Tab 1: About (Personal Info)**
- Profile picture (upload)
- Full Name
- Login ID (read-only, auto-generated)
- Email
- Phone
- Address
- Gender
- Marital Status
- Nationality
- Department (dropdown)
- Job Position
- Date of Joining
- Manager (dropdown, list of employees)
- Interests & Hobbies (text area)
- Certifications (text area or list)

**Tab 2: Private Info**
- Private Address
- Date of Birth
- Place of Birth
- SSN / Aadhar / Government ID
- Marital Status
- Number of Dependent Children
- Emergency Contact Name & Phone

**Tab 3: Salary Info** *(Visible only to Admin / Payroll Officer)*
- Wage Type: Monthly / Hourly (radio/select)
- Monthly Wage (₹ input) + Yearly wage (auto-calculated, read-only)
- Hourly Rate (shown if Hourly selected)
- **Salary Components Table:**
  | Component | % of Wage | ₹ Amount |
  |-----------|-----------|---------|
  | Basic | input% | auto |
  | HRA | input% | auto |
  | Standard Allowance | input% | auto |
  | Performance Bonus | input% | auto |
  | Leave Travel Allowance | input% | auto |
  | Food Allowance | input% | auto |
- **Deductions:**
  | Component | % | ₹ Amount |
  |-----------|---|---------|
  | Provident Fund (Employee) | 12% (fixed) | auto |
  | Provident Fund (Employer) | 12% (fixed) | auto |
  | Professional Tax | — | ₹200 (fixed, configurable) |
- **Important Notes (shown as info box):**
  - The Salary Information tab should define salary structure defaults
  - Each component should include: Basic, HRA, Performance Bonus, Standard Allowance, Travel Allowance, etc.
  - Computation type: Fixed amount or percentage of wage
  - Salary component values should not exceed the defined wage
  - System auto-calculates each component based on employee's defined wage

**Tab 4: Security**
- Login ID (read-only)
- Change Password section:
  - Old Password
  - New Password
  - Confirm Password
  - "Reset Password" button
  - Note: *"Make sure the employee knows the password through a secure digital method. The password change applies differently for administrators and regular users."*
- **Bank Account Details** (shown if bank account defaults exist):
  - If no bank account: show warning "They below warning should be displayed"
  - Bank Account Number
  - IFSC Code
  - Bank Name

**Action Buttons (top of profile):**
- **Edit** (Admin / HR Officer)
- **Save** (when in edit mode)
- **Archive** (Admin only)

---

### 5.3 ATTENDANCE MODULE

#### 5.3.1 Attendance List — Admin / HR Officer / Payroll Officer (`/attendance`)
- **Date navigation:** `< >` arrows + Date filter (Day / Week / Month toggle)
- **Search bar** — filter by employee name
- **Table columns:**
  | Employee | Check In | Check Out | Work Hours | Overtime Hours | Extra Hours |
- Data shows attendance of ALL employees for the selected period
- Month view shows aggregated stats: count of days present, late count, total working days
- **NOTE:** 
  - Attendance page should show by default for ongoing month, displaying details based on working time
  - Attendance data serves as the basis for payroll generation
  - The system should use attendance records to determine total payable days per employee
  - Any unpaid leave or missing attendance days automatically reduces payable days during payroll computation

#### 5.3.2 Attendance View — Employee (`/attendance`)
- Shows **only their own** attendance records
- Columns: Date, Check In, Check Out, Work Hours, Extra Hours
- Month view with date navigation
- Can see their own monthly attendance log

---

### 5.4 TIME OFF (LEAVE) MODULE

#### 5.4.1 Time Off — Admin / HR Officer View (`/time-off`)
- **Two sub-tabs:** "Paid Time Off" | "Sick Time Off"
- **Allocation Summary Bar:** "24 Days Available" | "22 Days Available"
- **Table columns:** Name | Start Date | End Date | Time Off Type | Status
- **Status badges:** 
  - Green = Approved (e.g., "Paid Time Off")
  - Red = Refused
  - Orange/Yellow = Pending
- **"Reject" and "Approve" buttons** on each pending row
- **Search / filter** by employee

#### 5.4.2 Time Off — Employee View (`/time-off`)
- **Two sub-tabs:** "Paid Time Off" | "Sick Time Off"
- Shows allocation: "24 Days Available" | "22 Days Available"
- Table shows **only their own** time off records
- Columns: Name | Start Date | End Date | Time Off Type | Status
- **"New" button** → opens Time Off Request Form

#### 5.4.3 Time Off Request Form (Modal or Page)
**Fields:**
- Employee (dropdown — pre-filled with logged-in user if Employee role)
- Time Off Type (dropdown: Paid Time Off / Sick Leave / Unpaid Leave)
- Validity Period: From [date] To [date]
- Allocation (auto-calculated days based on date range, e.g., "21.00 Days")
- Attachment (file upload — "You can have certificates")
- **"Refuse" button** | **"Approve" button** (for HR/Payroll Officer / Admin)
- Note: *"Employees can view only their own time off records, while Admins and HR Officers can view time off records & approve/reject them for all employees."*

#### 5.4.4 Time Off Allocation (`/time-off/allocation`) — Admin / HR Officer Only
- **"New" button** → open allocation form
- Allocation form fields:
  - Employee (dropdown — with list of all employees)
  - Time Off Type (dropdown)
  - Validity Period: From [date] To [date]
  - Allocation (number of days)
  - Date (effective date)
- **Dropdown shows all employees and their time off types**

**Time Off Types to seed:**
1. Paid Time Off
2. Sick Leave
3. Unpaid Leave

---

### 5.5 PAYROLL MODULE *(Admin / Payroll Officer only)*

#### 5.5.1 Payroll Dashboard (`/payroll`)
- **Left panel — warnings/alerts:**
  - "Employees without Bank Acc" (list with link)
  - "Employees without Manager" (list with link)
- **Right panel — Payruns:**
  - Current month payrun card (e.g., "Payrun Oct 2025" — clickable link)
  - Previous month payrun card (e.g., "Payrun Sept 2025" — clickable link)
- **Charts (bottom):**
  - Employee count chart (monthly, with salary vs without salary)
  - Payrun amount trend (bar chart by month)

#### 5.5.2 Payrun List / Generation (`/payroll/payrun`)
- **Tabs:** Dashboard | Validate (toggle)
- **"Payrun" button** to initiate a new payrun
- **Table — Payslip list:**
  | Pay Period | Employee | Employee Cost | Basic Wage | NET Wage | Status |
  |------------|----------|---------------|------------|----------|--------|
  | Oct 2025 | [Employee 1] | ₹50,000 | ₹28,000 | ₹50,000 | ₹42,800 | green badge |
- **Status badges:** Draft = grey, Validated = green, Cancelled = red
- **Employee row note:** 
  - *Employer cost = employee's monthly wage*
  - *Basic wage = refers to employee's basic salary i.e. 40% of basic*
  - *Gross wage = total of gross salary + all allowances*
  - *NET wage = total of gross wage – deductions*
- **"Generate" button** → generates payslips for all employees at once when in Payrun
- All employee payslips are created automatically upon generation

#### 5.5.3 Individual Payslip View (`/payroll/payslip/:id`)
**Header:**
- Employee name
- Payrun name (e.g., "Payrun Oct 2025")
- Salary Structure type (e.g., "Regular Pay")
- Period: "01 Oct To 31 Oct"

**Tabs: Worked Days | Salary Computation**

**Worked Days Tab:**
| Type | Days | Amount |
|------|------|--------|
| Attendance | 20.00 (20 working days in week) | ₹43,833.33 |
| Paid Time Off | 2.00 (2 Paid leave/Month) | ₹4,166.67 |
| **Total** | **22.00** | |

*Note: Salary is calculated based on the employee's monthly attendance. Paid leave is included in the total payable days, while unpaid leaves are deducted from the salary.*

**Salary Computation Tab:**
| Type | Basis % | Amount |
|------|---------|--------|
| Basic Salary | 100 | ₹25,000.00 |
| House Rent Allowance | 100 | ₹12,500.00 |
| Standard Allowance | 100 | ₹50,000.00 |
| Performance Bonus | 100 | ₹2,082.50 |
| Leave Travel Allowance | 100 | ₹4,162.50 |
| Food Allowance | 100 | ₹4,168.00 |
| **Gross** | | |
| PF Deduction | 100 | -₹3,000.00 |
| PF Deduction | 100 | -₹3,000.00 |
| Professional Tax | 100 | -₹200.00 |
| **Net Amount** | | **₹42,800.00** |

**Action buttons:** Edit | Save | Validate | Cancel | Print

**"Validate" behavior:** Changes status from DRAFT → DONE (green badge)

#### 5.5.4 Payslip PDF Print Format
When clicking **Print**, generate a PDF with:

```
[Company Logo]                        Salary slip for month of [Month Year]

Employee name: [name]           Pay: [amount]
Employee Code: [Login ID]       UAN: [number]
[Department]                    Pay period: [start - end]
Location: [location]            Pay date: [date]

WORKED DAYS
Attendance: [N] days
Leave: [N] days

EARNINGS                    AMOUNT    DEDUCTIONS              AMOUNT
Basic Salary                ₹ X.00    PF deduction            -₹ 0.00
House Rent Allowance        ₹ X.00    PF deduction            -₹ 0.00
Standard Allowance          ₹ X.00    Professional Tax        -₹ 0.00
Performance Bonus           ₹ X.00    
Leave Travel Allowance      ₹ X.00    
Food Allowance              ₹ X.00    

                    Net Payable (Gross Earning – Total deductions)
                    [Amount in words only]
```

---

### 5.6 REPORTS MODULE *(Admin / Payroll Officer only)*

#### 5.6.1 Reports Page (`/reports`)
- Section header: "Salary Statement Report"
- **"Print" button**
- Filter form:
  - Employee (dropdown — select specific employee)
  - Year (dropdown)
  - **"Print" button** (secondary action)
- **Preview of Salary Statement Report:**

```
[Company]
Salary Statement Report
Employee Name: [name]
Designation: [title]
Salary Component: [type]

                Earnings                    Deductions
         Basic    HRA    ...total    PF    Prof Tax  ...total    Net Salary
Jan       ₹X      ₹X     ₹X         ₹X    ₹X        ₹X         ₹X
Feb       ...
...
Dec       ...
Total     ...
```

- Reports are only accessible to Admin and Payroll Officer roles
- To print the Salary Statement Report: select employee + year → click Print → generates the full-year report

---

### 5.7 SETTINGS MODULE *(Admin only)*

#### 5.7.1 User Settings (`/settings`)
- **Table of all users:**
  | User Name | Login ID | Email | Role |
  |-----------|----------|-------|------|
  | [name]    | [id]     | [email@domain.com] | [dropdown] |
- **Role column** is an editable dropdown per user: Employee / Admin Officer / HR Officer / Payroll Officer
- **Inline editing:** Admin can change any user's role directly from this table
- Note: *"In the Admin Settings, the administrator can assign user access rights based on each user's role. Access rights can be configured on a module basis, allowing specific permissions for each module."*
- Note: *"Select user access rights as per their role and responsibilities. These access rights define what users are allowed to access and what they are restricted from accessing. Employee / Admin / HR Officer / Payroll Officer"*

---

## 6. ADDITIONAL COMPONENTS & BEHAVIORS

### 6.1 Password Management
- Accessible from employee profile → Security tab
- Fields: Old Password, New Password, Confirm Password
- "Reset Password" button
- Note: *"Make sure the employee knows the password through a secure digital method. The password change should be different for administrators and regular users."*

### 6.2 Login ID Auto-Generation
- **Format:** `CC-ZZZZ-YYYY-NNNN`
  - `CC` = First 2 letters of company name (e.g., "OD" for Odoo)
  - `ZZZZ` = First 2 letters of first name + first 2 letters of last name (e.g., "KSJO" for Kshitij Joshi)
  - `YYYY` = Year of joining (e.g., 2024)
  - `NNNN` = Serial number of joining for that year (e.g., 0001)
- **Example:** `OD-KSJO-2024-0001`
- Generated automatically by system; shown as read-only to user
- Normal users cannot change the login ID; only HR Officer or Admin can create new employee accounts, which triggers auto-generation

### 6.3 Email Notification (New Employee)
- When a new employee account is created, the user receives an email with:
  - Their Login ID
  - Their temporary auto-generated password
- The user should be able to change the password after first login (via Security tab)

### 6.4 Status Indicators (Employee Cards / List)
- 🟢 **Green dot** = Employee is present in the office (checked in today)
- 🔴 **Red dot** = Employee is on leave (approved time-off for today)
- 🟡 **Yellow dot** = Employee is absent (no time-off applied, not checked in)

### 6.5 Check In / Check Out System
- Available on the Dashboard and/or Attendance page
- Shows current date
- "Check In →" button — triggers attendance record creation
- On successful Check In → status dot changes from red/yellow to green
- "Check Out →" button — completes the attendance record
- Shows "Time 16:00:19" style clock

### 6.6 Bank Account Warning
- If an employee profile has no bank account details, show this warning in the employee profile (Security tab) and on Payroll Dashboard:
  - *"They below warning should be displayed"* — adapt to: "⚠️ No bank account on file. Please add bank details to ensure payroll processing."

---

## 7. BUSINESS LOGIC & CALCULATIONS

### 7.1 Payroll Computation Flow
```
1. HR Officer marks/confirms attendance for the period
2. Payroll Officer creates a new Payrun for the month
3. System generates payslips for all active employees
4. For each payslip:
   a. Fetch employee's salary structure
   b. Count attendance days (from Attendance records)
   c. Count approved paid leave days (from TimeOffRequest)
   d. Payable Days = Attendance Days + Paid Leave Days
   e. Daily Rate = Monthly Wage / Total Working Days in Month
   f. Gross = Daily Rate × Payable Days
   g. Calculate each component (Basic, HRA, etc.) as % of Gross
   h. PF = 12% of Basic
   i. Professional Tax = fixed amount (e.g., ₹200)
   j. Net = Gross - PF(employee) - Professional Tax
5. Payroll Officer reviews and validates payslips
6. Upon validation, payslips are marked as DONE
7. Admin/Payroll Officer can print individual payslips as PDF
```

### 7.2 Leave Impact on Payroll
- **Approved Paid Leave** → counts as worked days (no salary deduction)
- **Approved Unpaid Leave** → deducted from payable days
- **Unapproved Absence** → deducted from payable days
- Formula: `Absent deduction = (Monthly Wage / Working Days) × Absent Days`

### 7.3 Yearly Wage Auto-Calculation
- `Yearly Wage = Monthly Wage × 12`
- Display as read-only alongside monthly wage input

---

## 8. FORM VALIDATION RULES

- All required fields must show inline error messages
- Email: must be valid format
- Phone: numeric, 10 digits (Indian format)
- Password: minimum 8 characters, at least one number
- Confirm Password: must match Password
- Wage: must be a positive number
- Salary component percentages: sum of all components must not exceed 100% of gross wage
- Date ranges: End date must be after Start date
- Leave allocation: cannot exceed available balance

---

## 9. NAVIGATION STRUCTURE (Routes)

```
/                         → redirect to /login
/login                    → Login Page
/signup                   → Registration Page

/dashboard                → Dashboard (role-specific content)

/employees                → Employee List
/employees/new            → Create Employee Form
/employees/:id            → Employee Profile (tabs: About, Private, Salary, Security)

/attendance               → Attendance (role-specific view)

/time-off                 → Time Off List (role-specific view)
/time-off/new             → New Time Off Request Form
/time-off/allocation      → Allocation Management (Admin/HR only)
/time-off/allocation/new  → New Allocation Form

/payroll                  → Payroll Dashboard (Admin/Payroll Officer only)
/payroll/payrun           → Payrun List
/payroll/payrun/new       → Create Payrun
/payroll/payrun/:id       → Payrun Detail (list of payslips)
/payroll/payslip/:id      → Individual Payslip View/Edit

/reports                  → Reports (Admin/Payroll Officer only)

/settings                 → Settings / User Management (Admin only)

/profile                  → My Profile (redirects to /employees/:own_id)
```

---

## 10. UI / UX GUIDELINES

### Color Scheme (suggested)
- **Primary:** Deep purple/violet (`#6C47FF` or similar) — for sidebar active state, buttons
- **Secondary:** Teal/Green for success states
- **Warning:** Amber/Orange
- **Error:** Red
- **Background:** Light grey (`#F5F5F5`)
- **Card background:** White (`#FFFFFF`)
- **Sidebar background:** Dark (`#1E1E2D` or white with border)

### Layout
- **Left sidebar** (fixed, ~240px wide) with logo at top and nav links
- **Top bar** with company name, notifications, user avatar
- **Main content area** (scrollable)
- **Cards** with subtle shadows for dashboard widgets
- **Tables** with alternating row colors, hover states
- **Modals** for forms where quick input is needed
- **Tabs** within profile pages (no page reload on tab switch)

### Responsive Design
- Must work on desktop (1280px+) and tablet (768px+)
- Sidebar collapses to icon-only on smaller screens
- Tables become scrollable horizontally on mobile

### Buttons
- Primary action: Filled button (primary color)
- Secondary action: Outlined button
- Danger action: Red filled button
- Consistent sizing: height 36–40px, padding 12–24px

---

## 11. SEED DATA / INITIAL SETUP

On first run, seed the database with:

**Roles:** ADMIN, HR_OFFICER, PAYROLL_OFFICER, EMPLOYEE

**Time Off Types:**
1. Paid Time Off (is_paid: true)
2. Sick Leave (is_paid: true)
3. Unpaid Leave (is_paid: false)

**Demo Users (for testing):**
| Name | Role | Email | Password |
|------|------|-------|----------|
| Admin User | ADMIN | admin@empay.com | Admin@123 |
| HR Officer | HR_OFFICER | hr@empay.com | Hr@123 |
| Payroll Officer | PAYROLL_OFFICER | payroll@empay.com | Pay@123 |
| Employee 1 | EMPLOYEE | emp1@empay.com | Emp@123 |
| Employee 2 | EMPLOYEE | emp2@empay.com | Emp@123 |

**Demo Salary Structures (for demo employees):**
- Monthly Wage: ₹50,000
- Basic: 40% → ₹20,000
- HRA: 50% of basic → ₹10,000
- Standard Allowance: 10% → ₹5,000
- Performance Bonus: 5% → ₹2,500
- Travel Allowance: 5% → ₹2,500
- Food Allowance: 5% → ₹2,500
- PF: 12% of basic → ₹2,400
- Professional Tax: ₹200

---

## 12. DELIVERABLES CHECKLIST

### Screens to Build (Minimum)
- [ ] Login Page
- [ ] Sign Up / Registration Page
- [ ] Dashboard (all 4 role variants)
- [ ] Check In / Check Out widget
- [ ] Employee List Page
- [ ] Employee Create Form
- [ ] Employee Profile (4 tabs: About, Private Info, Salary Info, Security)
- [ ] Attendance List — Admin/HR/Payroll view
- [ ] Attendance List — Employee view
- [ ] Time Off List — Admin/HR view (with approve/reject)
- [ ] Time Off List — Employee view
- [ ] Time Off Request Form
- [ ] Time Off Allocation Form
- [ ] Payroll Dashboard
- [ ] Payrun List / Generation Page
- [ ] Individual Payslip Detail (Worked Days + Salary Computation tabs)
- [ ] Payslip Print / PDF Export
- [ ] Reports Page (Salary Statement)
- [ ] Settings / User Role Management Page
- [ ] My Profile (own profile view/edit)
- [ ] Password Change Form

### Features to Implement
- [ ] JWT Auth with role-based route protection
- [ ] Login ID auto-generation
- [ ] Attendance Check In / Check Out
- [ ] Status dots (Green/Red/Yellow) based on attendance
- [ ] Leave request → approval workflow
- [ ] Payrun generation (batch payslip creation)
- [ ] Salary calculation engine (attendance × wage structure)
- [ ] Payslip PDF generation
- [ ] Salary Statement Report (annual, per employee)
- [ ] Admin Settings — role management table
- [ ] Input validation (all forms)
- [ ] Responsive layout

### Git Requirements
- Meaningful commit messages (not "update", "fix stuff")
- Feature branches (e.g., `feature/payroll-module`, `feature/attendance`)
- Multiple contributors (not just one person managing the repo)

---

## 13. IMPORTANT NOTES FROM PROBLEM STATEMENT

1. **No static JSON** — use real database queries for all dynamic data
2. **Modular design** — each module (Employees → Attendance → Payroll) should communicate through the database/API, not hard-coded references
3. **Business logic priority** — payroll calculations must be accurate and based on actual attendance records
4. **Offline/local solutions preferred** — design the DB to work without always-on cloud connectivity
5. **Meaningful technology choices** — only use a technology if it adds real value; don't add libraries for their own sake
6. **AI/Code snippets** — if using AI-generated code, understand and adapt it; don't blindly copy-paste

---

*End of EmPay Build Specification*
