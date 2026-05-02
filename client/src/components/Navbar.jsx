import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-gray-300 flex items-center justify-end px-10 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        {/* Search Bar Placeholder (as seen in some screens) */}
        <div className="hidden lg:block w-96">
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-white border border-gray-300 rounded px-4 py-1 text-sm focus:outline-none focus:border-primary text-center"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-1">
          <div className="w-6 h-6 bg-red-600 rounded-full"></div>
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-8 h-8 bg-blue-400 rounded-sm flex items-center justify-center text-white font-bold"
          >
            <User className="w-5 h-5" />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-xl border border-gray-200 overflow-hidden z-50">
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (user?.employee_id) navigate(`/employees/${user.employee_id}`);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                >
                  My Profile
                </button>
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                >
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
