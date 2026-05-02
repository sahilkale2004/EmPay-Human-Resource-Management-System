import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Clock, LogIn, LogOut, CheckCircle } from 'lucide-react';

export const Attendance = () => {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('');

  const isEmployee = user?.role === 'EMPLOYEE';

  useEffect(() => {
    fetchData();
  }, []);

  // Timer for live elapsed time
  useEffect(() => {
    if (!todayRecord?.check_in || todayRecord?.check_out) return;
    const interval = setInterval(() => {
      const start = new Date(todayRecord.check_in);
      const diff = Date.now() - start.getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsedTime(`${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [todayRecord]);

  const fetchData = async () => {
    try {
      const [attRes] = await Promise.all([
        api.get('/attendance'),
      ]);
      setRecords(attRes.data.data || []);

      if (isEmployee) {
        const todayRes = await api.get(`/attendance/today/${user.employee_id}`);
        setTodayRecord(todayRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/checkin');
      toast.success('Checked in successfully!');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/checkout');
      toast.success('Checked out successfully!');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>

      {/* Check In/Out Card for employees */}
      {isEmployee && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-blue-200 font-medium mb-1">Today — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              {todayRecord?.check_in && !todayRecord?.check_out ? (
                <>
                  <h2 className="text-4xl font-bold font-mono tracking-widest">{elapsedTime || '00:00:00'}</h2>
                  <p className="text-blue-200 mt-1 text-sm">Clocked in at {formatTime(todayRecord.check_in)}</p>
                </>
              ) : todayRecord?.check_out ? (
                <>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CheckCircle className="w-7 h-7 text-green-300" />
                    Shift Completed
                  </h2>
                  <p className="text-blue-200 mt-1 text-sm">
                    {formatTime(todayRecord.check_in)} – {formatTime(todayRecord.check_out)} · {parseFloat(todayRecord.work_hours).toFixed(1)} hrs
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">You haven't checked in yet</h2>
                  <p className="text-blue-200 mt-1 text-sm">Start your work day by checking in below</p>
                </>
              )}
            </div>
            <div className="flex gap-3">
              {!todayRecord && (
                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 py-4 rounded-xl flex items-center gap-2 shadow-md transition-all hover:scale-105 disabled:opacity-70"
                >
                  <LogIn className="w-5 h-5" />
                  Check In
                </button>
              )}
              {todayRecord?.check_in && !todayRecord?.check_out && (
                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="bg-red-400 hover:bg-red-300 text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 shadow-md transition-all hover:scale-105 disabled:opacity-70"
                >
                  <LogOut className="w-5 h-5" />
                  Check Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-gray-900">Attendance Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                {!isEmployee && <th className="px-6 py-4">Employee</th>}
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Work Hours</th>
                <th className="px-6 py-4">Overtime</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={isEmployee ? 6 : 7} className="px-6 py-8 text-center text-gray-500 animate-pulse">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={isEmployee ? 6 : 7} className="px-6 py-8 text-center text-gray-400">No attendance records found.</td></tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    {!isEmployee && (
                      <td className="px-6 py-4 font-medium text-gray-900">{rec.first_name} {rec.last_name}</td>
                    )}
                    <td className="px-6 py-4 text-gray-600">{new Date(rec.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600">{formatTime(rec.check_in)}</td>
                    <td className="px-6 py-4 text-gray-600">{formatTime(rec.check_out)}</td>
                    <td className="px-6 py-4 text-gray-600">{rec.work_hours ? `${parseFloat(rec.work_hours).toFixed(1)} hrs` : '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{rec.overtime_hours > 0 ? `${parseFloat(rec.overtime_hours).toFixed(1)} hrs` : '-'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rec.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    PRESENT: 'bg-green-50 text-green-700',
    ABSENT: 'bg-red-50 text-red-700',
    ON_LEAVE: 'bg-orange-50 text-orange-700',
    HALF_DAY: 'bg-yellow-50 text-yellow-700',
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};
