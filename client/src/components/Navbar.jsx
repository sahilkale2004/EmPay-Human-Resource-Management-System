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
        {/* User Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold relative group"
          >
            <div className="w-8 h-8 bg-blue-400 rounded-sm flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 shadow-xl overflow-hidden z-50">
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (user?.employee_id) navigate(`/employees/${user.employee_id}`);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-200"
                >
                  My Profile
                </button>
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
