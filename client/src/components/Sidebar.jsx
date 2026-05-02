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
    <div className="w-56 bg-[#1C2B1E] h-screen flex flex-col fixed left-0 top-0 z-50">
      {/* Brand */}
      <div className="p-5 border-b border-[#2E4232] flex flex-col items-center gap-2">
        <div className="w-full flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-lg bg-[#5C7A5F] flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight tracking-wide">EmPay</p>
            <p className="text-[#7FA882] text-[10px] font-medium uppercase tracking-widest">HR System</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 mt-3 flex flex-col gap-0.5 px-2">
        {links.map((link) => {
          if (!user || !link.roles.includes(user.role)) return null;
          
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                  isActive 
                    ? "bg-[#5C7A5F] text-white shadow-sm" 
                    : "text-[#A8C4AB] hover:bg-[#2E4232] hover:text-white"
                )
              }
            >
              <link.icon className="w-4 h-4 shrink-0" />
              {link.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom user role badge */}
      {user && (
        <div className="p-4 border-t border-[#2E4232]">
          <p className="text-[#7FA882] text-[10px] font-bold uppercase tracking-widest text-center">
            {user.role?.replace('_', ' ')}
          </p>
        </div>
      )}
    </div>
  );
};
