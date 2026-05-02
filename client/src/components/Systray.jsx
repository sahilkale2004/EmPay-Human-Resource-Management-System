import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Play, Square, Loader2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export const Systray = () => {
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchToday();
  }, []);

  const fetchToday = async () => {
    try {
      const res = await api.get('/attendance/today-status');
      if (res.data.success) {
        setTodayRecord(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch today status');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/attendance/${action}`);
      if (res.data.success) {
        toast.success(action === 'check-in' ? 'Checked in!' : 'Checked out!');
        window.dispatchEvent(new Event('attendanceChanged'));
        fetchToday();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || todayRecord?.check_out) return null;

  return (
    <div className="fixed bottom-10 right-10 z-50 space-y-4">
      {/* Check In Block */}
      {!todayRecord?.check_in && (
        <div className="bg-white border border-gray-300 p-4 shadow-sm min-w-[160px]">
          <button 
            onClick={() => handleAction('check-in')}
            disabled={actionLoading}
            className="w-full flex items-center justify-between text-sm font-medium text-gray-800 hover:text-black transition-colors group"
          >
            <span>Check IN</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Check Out Block */}
      {todayRecord?.check_in && (
        <div className="bg-white border border-gray-300 p-4 shadow-sm min-w-[160px] space-y-2">
          <p className="text-[10px] text-gray-400 font-medium italic">
            Since {new Date(todayRecord.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <button 
            onClick={() => handleAction('check-out')}
            disabled={actionLoading}
            className="w-full flex items-center justify-between text-sm font-medium text-gray-800 hover:text-black transition-colors group"
          >
            <span>Check Out</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};
