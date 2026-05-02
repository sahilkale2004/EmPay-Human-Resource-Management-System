import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, ChevronDown, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-14 bg-[#FDFBF8] border-b border-[#DDD8CF] flex items-center justify-end px-8 sticky top-0 z-40 shadow-[0_1px_4px_rgba(92,122,95,0.06)]">
      <div className="flex items-center gap-5">
        {/* Search Bar */}
        <div className="hidden lg:block w-72">
          <input 
            type="text" 
            placeholder="Search employees, records…" 
            className="w-full bg-[#F5F2ED] border border-[#DDD8CF] rounded-lg px-4 py-1.5 text-sm text-[#2A2520] placeholder-[#9C9286] focus:outline-none focus:border-[#5C7A5F] focus:ring-2 focus:ring-[#5C7A5F]/10 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-[#EDE9E3] transition-colors">
          <Bell className="w-5 h-5 text-[#6B6259]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#B84040] rounded-full border border-[#FDFBF8]"></span>
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#EDE9E3] transition-colors group"
          >
            <div className="w-7 h-7 bg-[#5C7A5F] rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-[#2A2520] hidden md:block">
              {user?.email?.split('@')[0]}
            </span>
            <ChevronDown className={clsx("w-4 h-4 text-[#9C9286] transition-transform", isDropdownOpen && "rotate-180")} />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-52 bg-[#FDFBF8] rounded-xl shadow-xl border border-[#DDD8CF] overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#DDD8CF] bg-[#F5F2ED]">
                  <p className="text-xs font-bold text-[#5C7A5F] uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
                  <p className="text-sm font-medium text-[#2A2520] mt-0.5 truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (user?.employee_id) navigate(`/employees/${user.employee_id}`);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#2A2520] hover:bg-[#F5F2ED] border-b border-[#EDE9E3] transition-colors"
                >
                  <User className="w-4 h-4 text-[#5C7A5F]" />
                  My Profile
                </button>
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#B84040] hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
