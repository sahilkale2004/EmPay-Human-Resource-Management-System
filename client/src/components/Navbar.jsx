import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { NotificationBell } from './NotificationBell';

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
        {/* Attendance Toggle */}
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

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-9 h-9 rounded-full border-2 border-primary overflow-hidden hover:opacity-80 transition-opacity"
          >
            {user?.profile_picture ? (
              <img 
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profile_picture}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = ''; e.target.onerror = null; }}
              />
            ) : (
              <div className="w-full h-full bg-surface flex items-center justify-center">
                <User className="w-5 h-5 text-muted" />
              </div>
            )}
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
              <div className="absolute right-0 mt-3 w-56 bg-white border border-border shadow-2xl rounded-2xl overflow-hidden z-50 animate-fade-in-up">
                {/* User Info Header */}
                <div className="px-4 py-4 bg-surface/50 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-white shadow-sm overflow-hidden bg-white shrink-0">
                    {user?.profile_picture ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profile_picture}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-full h-full p-2 text-muted" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text truncate leading-tight">
                      {user?.login_id || 'User'}
                    </p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">
                      {user?.role?.replace('_', ' ') || 'Staff'}
                    </p>
                  </div>
                </div>
                
                <div className="p-1">
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (user?.employee_id) navigate(`/employees/${user.employee_id}`);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-text-soft hover:bg-surface rounded-xl transition-colors"
                  >
                    My Profile
                  </button>
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-error hover:bg-error/5 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
