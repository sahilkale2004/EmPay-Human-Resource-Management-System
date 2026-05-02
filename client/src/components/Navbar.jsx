import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import api from '../lib/api';
import toast from 'react-hot-toast';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [attendance, setAttendance] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/attendance/today-status');
        setAttendance(res.data.data);
      } catch (err) {}
    };
    fetchStatus();
    
    window.addEventListener('attendanceChanged', fetchStatus);
    const interval = setInterval(fetchStatus, 30000);
    
    return () => {
      window.removeEventListener('attendanceChanged', fetchStatus);
      clearInterval(interval);
    };
  }, []);

  const isPresent = attendance?.check_in && !attendance?.check_out;

  const handleToggleAttendance = async () => {
    try {
      const action = isPresent ? 'checkout' : 'checkin';
      const res = await api.post(`/attendance/${action}`);
      if (res.data.success) {
        toast.success(isPresent ? 'Checked out!' : 'Checked in!');
        // Sync with Systray
        window.dispatchEvent(new Event('attendanceChanged'));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    }
  };

  return (
    <header className="h-14 bg-white border-b border-gray-300 flex items-center justify-end px-10 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        {/* Clickable Status Dot - Only for Employees */}
        {user?.employee_id && (
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleToggleAttendance();
            }}
            title={isPresent ? "Click to Check Out" : "Click to Check In"}
            className="p-2 -m-2 flex items-center group relative cursor-pointer z-50 pointer-events-auto"
          >
            <div className={clsx(
              "w-3 h-3 rounded-full border border-gray-300 transition-all duration-300 transform group-hover:scale-125 shadow-sm",
              isPresent ? "bg-green-500" : "bg-red-500"
            )}></div>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {isPresent ? "Check Out" : "Check In"}
            </span>
          </button>
        )}

        {/* User Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center relative group overflow-hidden border border-gray-200"
          >
            <div className="w-8 h-8 bg-blue-400 rounded-sm flex items-center justify-center text-white">
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
