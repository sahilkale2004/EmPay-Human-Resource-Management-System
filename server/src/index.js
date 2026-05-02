require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const timeoffRoutes = require('./routes/timeoff');
const payrollRoutes = require('./routes/payroll');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const httpServer = require('http').createServer(app);
const { Server } = require('socket.io');

const io = new Server(httpServer, {
  cors: { 
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true 
  }
});

const connectedAdmins = new Map();

io.on('connection', (socket) => {
  socket.on('register', ({ userId, role }) => {
    if (['ADMIN', 'HR_OFFICER'].includes(role)) {
      connectedAdmins.set(userId, socket.id);
      console.log(`Admin/HR registered: ${userId} (${socket.id})`);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedAdmins.entries()) {
      if (socketId === socket.id) {
        connectedAdmins.delete(userId);
        console.log(`Admin/HR disconnected: ${userId}`);
        break;
      }
    }
  });
});

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timeoff', timeoffRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io, httpServer, connectedAdmins };
