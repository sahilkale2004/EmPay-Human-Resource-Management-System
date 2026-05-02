import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Toaster } from 'react-hot-toast';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { EmployeesList } from './pages/employees/EmployeesList';
import { EmployeeDetail } from './pages/employees/EmployeeDetail';
import { AddEmployee } from './pages/employees/AddEmployee';
import { Attendance } from './pages/attendance/Attendance';
import { TimeOff } from './pages/timeoff/TimeOff';
import { Payroll } from './pages/payroll/Payroll';
import { Reports } from './pages/reports/Reports';
import { Settings } from './pages/settings/Settings';
import { Signup } from './pages/Signup';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<EmployeesList />} />

            <Route path="/employees">
              <Route index element={<EmployeesList />} />
              <Route path="new" element={<AddEmployee />} />
              <Route path=":id" element={<EmployeeDetail />} />
            </Route>

            <Route path="/attendance" element={<Attendance />} />
            <Route path="/timeoff" element={<TimeOff />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </AuthProvider>
  );
}

export default App;
