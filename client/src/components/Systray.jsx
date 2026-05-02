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

  const isCheckedIn = todayRecord?.check_in && !todayRecord?.check_out;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <div className="bg-[#FDFBF8] border border-[#DDD8CF] rounded-2xl shadow-2xl shadow-[#5C7A5F]/10 p-4 w-52 space-y-4">
        {/* Time display */}
        <div className="text-center pb-3 border-b border-[#EDE9E3]">
          <p className="text-[10px] font-bold text-[#9C9286] uppercase tracking-widest mb-0.5">Today</p>
          <p className="text-xl font-bold text-[#2A2520] tabular-nums">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[10px] text-[#9C9286] mt-0.5">
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {!todayRecord?.check_in ? (
          <button 
            onClick={() => handleAction('check-in')}
            disabled={actionLoading}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-[#5C7A5F] hover:bg-[#3F5C42] text-white rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
          >
            <span>Check IN</span>
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
        ) : !todayRecord?.check_out ? (
          <button 
            onClick={() => handleAction('check-out')}
            disabled={actionLoading}
            className="w-full flex items-center justify-between px-3 py-2.5 border border-[#B84040] text-[#B84040] hover:bg-[#B84040] hover:text-white rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
          >
            <span>Check Out</span>
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-current" />}
          </button>
        ) : (
          <div className="text-center py-2 text-xs font-bold text-[#4A8C4E] uppercase tracking-widest bg-[#4A8C4E]/10 rounded-xl">
            ✓ Shift Completed
          </div>
        )}
      </div>

      <div className="flex justify-end pr-2">
        <div className={clsx(
          "w-3 h-3 rounded-full shadow-sm border-2 border-[#FDFBF8]",
          isCheckedIn ? "bg-[#4A8C4E]" : "bg-[#C28A2B]"
        )}></div>
      </div>
    </div>
  );
};
