import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarOff, 
  Banknote, 
  FileBarChart, 
  Settings 
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = () => {
  const { user } = useAuth();

  const links = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard, roles: ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE'] },
    { name: 'Employees', to: '/employees', icon: Users, roles: ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE'] },
    { name: 'Attendance', to: '/attendance', icon: Clock, roles: ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE'] },
    { name: 'Time Off', to: '/timeoff', icon: CalendarOff, roles: ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE'] },
    { name: 'Payroll', to: '/payroll', icon: Banknote, roles: ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE'] },
    { name: 'Reports', to: '/reports', icon: FileBarChart, roles: ['ADMIN', 'HR_OFFICER'] },
    { name: 'Settings', to: '/settings', icon: Settings, roles: ['ADMIN'] },
  ];

  return (
    <div className="w-64 bg-sidebar text-white h-screen flex flex-col fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-wider text-primary flex items-center gap-2">
          <Banknote className="w-8 h-8 text-primary" />
          EmPay
        </h1>
      </div>
      
      <nav className="flex-1 mt-6 px-4 space-y-2">
        {links.map((link) => {
          if (!user || !link.roles.includes(user.role)) return null;
          
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-primary text-white font-medium" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )
              }
            >
              <link.icon className="w-5 h-5" />
              {link.name}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 text-xs text-gray-500 text-center">
        &copy; {new Date().getFullYear()} EmPay HRMS
      </div>
    </div>
  );
};
