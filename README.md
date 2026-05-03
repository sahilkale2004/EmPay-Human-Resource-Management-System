# EmPay HRMS 🚀

**EmPay** is a premium, full-stack Human Resource Management System (HRMS) designed for modern enterprises. It provides a seamless experience for managing employees, attendance, leave requests, and payroll with real-time notifications and automated communications.

![EmPay Dashboard](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20MySQL-blue?style=for-the-badge)

---

## ✨ Key Features

### 🏢 Core Modules
- **Dynamic Dashboard:** Real-time tracking of company funds and active employees.
- **Employee Directory:** Full lifecycle management (CRUD) with soft-deletion, detailed profiles.
- **Attendance Tracking:** Robust check-in/out system with daily status monitoring and history.
- **Time-Off Management:** Leave request workflow with automated balance deduction (Sick, Paid, Unpaid leaves).
- **Automated Payroll:** One-click payroll generation, automatic company fund deductions, and **Indian Currency Formatting (₹10,00,000)**.
- **Advanced Reporting:** Exportable and printable financial and employee reports.

### 🔔 Smart Systems
- **Real-Time Notifications:** WhatsApp-style unread message counts in the navbar for leave requests and new hires (Socket.io).
- **Email Service:** Automatic dispatch of premium HTML welcome kits with login credentials to new employees (Nodemailer).
- **Secure Authentication:** Role-based access control (RBAC) with JWT and bcrypt password hashing.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS 4, Lucide Icons, Recharts, Socket.io-Client |
| **Backend** | Node.js, Express, MySQL (pool), Socket.io, JWT, Multer |
| **Services** | Nodemailer (SMTP), PDFKit (Payslips) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MySQL](https://www.mysql.com/) server

### 1. Database Setup
Create a database named `empay` and run the following migration script (or use the provided seed file):
```bash
cd server
npm run seed
```

### 2. Environment Configuration
Create a `.env` file in the `server` directory:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=empay
JWT_SECRET=your_secret
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
CLIENT_URL=http://localhost:5173
```

### 3. Installation & Launch
**Server:**
```bash
cd server
npm install
npm start
```

**Client:**
```bash
cd client
npm install
npm run dev
```

---

## 📸 Project Structure

```text
EmPay/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── employees/  # Employee-related modals & cards
│   │   │   ├── payroll/    # Payroll processing UI
│   │   │   ├── ui/         # Base design system components
│   │   │   └── Navbar.jsx  # Main navigation with NotificationBell
│   │   ├── contexts/       # Auth & Global State
│   │   ├── pages/          # Full-screen module views
│   │   │   ├── attendance/ # Clock-in/out tracking
│   │   │   ├── payroll/    # Payrun management
│   │   │   ├── timeoff/    # Leave requests
│   │   │   └── reports/    # Financial analytics
│   │   ├── lib/            # Axios API configurations
│   │   └── services/       # Socket.io connection logic
│   └── public/             # Static assets
├── server/                 # Express Backend
│   ├── src/
│   │   ├── config/         # Database & Mailer configs
│   │   ├── controllers/    # API Request handlers
│   │   │   ├── payrollController.js
│   │   │   ├── employeeController.js
│   │   │   └── notificationController.js
│   │   ├── middleware/     # JWT Auth & Upload logic
│   │   ├── routes/         # Express Router definitions
│   │   ├── services/       # Core business logic services
│   │   │   ├── emailService.js
│   │   │   ├── pdfService.js
│   │   │   └── notificationService.js
│   │   └── index.js        # Main entry point & Socket initialization
│   ├── exports/            # Generated Payslip PDFs
│   └── uploads/            # Employee profile pictures
└── README.md
```

---

## 🤝 Contribution
Developed by **QuadCoders** with ❤️ for Advanced HR Management. 

---

## 🌟 Special Thanks
We would like to express our sincere gratitude to **Odoo** and **VIT** for conducting the **Odoo x VIT Hackathon**. This project was built during the hackathon, providing us with an incredible opportunity to learn, innovate, and build a real-world solution for modern HR needs.
