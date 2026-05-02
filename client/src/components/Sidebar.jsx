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
    { name: 'Employees', to: '/employees', icon: Users, roles: ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE'] },
    { name: 'Attendance', to: '/attendance', icon: Clock, roles: ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE'] },
    { name: 'Time Off', to: '/timeoff', icon: CalendarOff, roles: ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE'] },
    { name: 'Payroll', to: '/payroll', icon: Banknote, roles: ['ADMIN', 'PAYROLL_OFFICER'] },
    { name: 'Reports', to: '/reports', icon: FileBarChart, roles: ['ADMIN', 'PAYROLL_OFFICER'] },
    { name: 'Settings', to: '/settings', icon: Settings, roles: ['ADMIN'] },
  ];

  return (
    <div className="w-56 bg-[#f8f9fa] border-r border-gray-300 h-screen flex flex-col fixed left-0 top-0 z-50">
      {/* Brand */}
      <div className="p-4 border-b border-gray-300 flex flex-col items-center gap-2">
        <div className="w-full h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-[10px] font-bold text-center px-2">
          Company Name & Logo
        </div>
      </div>
      
      <nav className="flex-1 mt-2 flex flex-col">
        {links.map((link) => {
          if (!user || !link.roles.includes(user.role)) return null;
          
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-4 py-2.5 transition-all text-sm font-medium",
                  isActive 
                    ? "bg-[#D1D5DB] text-gray-900 border-l-4 border-primary" 
                    : "text-gray-600 hover:bg-gray-100"
                )
              }
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
