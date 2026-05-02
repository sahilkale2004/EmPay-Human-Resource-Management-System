import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Play, Square, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export const Systray = () => {
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    fetchToday();
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
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
        fetchToday();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <div className="bg-white border border-gray-300 rounded shadow-2xl p-4 w-48 space-y-4">
        <div className="text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {!todayRecord?.check_in ? (
          <button 
            onClick={() => handleAction('check-in')}
            disabled={actionLoading}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-all group"
          >
            Check IN
            <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full group-hover:bg-green-500"></div>
            </div>
          </button>
        ) : !todayRecord?.check_out ? (
          <button 
            onClick={() => handleAction('check-out')}
            disabled={actionLoading}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-all"
          >
            Check Out
            <Square className="w-3 h-3 text-red-500 fill-current" />
          </button>
        ) : (
          <div className="text-center py-2 text-[10px] font-bold text-green-600 uppercase tracking-widest">
            Shift Ended
          </div>
        )}
      </div>

      <div className="flex justify-end pr-2">
        <div className={clsx(
          "w-3 h-3 rounded-full border border-gray-400 shadow-sm",
          todayRecord?.check_in && !todayRecord?.check_out ? "bg-green-500" : "bg-amber-400"
        )}></div>
      </div>
    </div>
  );
};
