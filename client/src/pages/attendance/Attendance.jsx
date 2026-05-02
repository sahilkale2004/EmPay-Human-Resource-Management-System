import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import clsx from 'clsx';

export const Attendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const isAdminView = ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(user?.role);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dateStr = currentDate.toISOString().split('T')[0];
      const res = await api.get(`/attendance?date=${dateStr}`);
      setRecords(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevDate = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNextDate = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-medium text-gray-700">Attendances {isAdminView ? 'List view' : ''}</h1>
        
        {/* Controls Header */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded border border-gray-300 shadow-sm">
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button onClick={handlePrevDate} className="p-1.5 hover:bg-gray-100 border-r border-gray-300 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={handleNextDate} className="p-1.5 hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-1.5 border border-gray-300 rounded text-sm font-medium bg-gray-50">
            {currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          <div className="px-4 py-1.5 border border-gray-300 rounded text-sm font-medium bg-gray-50">
            {currentDate.toLocaleDateString('en-GB', { weekday: 'long' })}
          </div>

          {isAdminView && (
            <div className="flex-1 max-w-xs relative ml-auto">
              <input 
                type="text" 
                placeholder="Searchbar" 
                className="w-full bg-white border border-gray-300 rounded px-4 py-1.5 text-sm focus:outline-none focus:border-primary text-center"
              />
            </div>
          )}
        </div>
      </div>

      {!isAdminView && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Out of" value="22" sub="days present" />
          <StatBox label="Current count" value={records.length} />
          <StatBox label="Total working days" value="24" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-300 rounded overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300">
              {isAdminView ? (
                <th className="px-6 py-3 border-r border-gray-300 font-medium text-gray-700">Emp</th>
              ) : (
                <th className="px-6 py-3 border-r border-gray-300 font-medium text-gray-700">Date</th>
              )}
              <th className="px-6 py-3 border-r border-gray-300 font-medium text-gray-700">Check In</th>
              <th className="px-6 py-3 border-r border-gray-300 font-medium text-gray-700">Check Out</th>
              <th className="px-6 py-3 border-r border-gray-300 font-medium text-gray-700">Work Hours</th>
              <th className="px-6 py-3 font-medium text-gray-700">Extra hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center animate-pulse text-gray-400">Loading attendance...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">No records for this date.</td></tr>
            ) : (
              records.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 border-r border-gray-300 text-gray-600 font-medium">
                    {isAdminView ? `[${rec.first_name} ${rec.last_name}]` : new Date(rec.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 border-r border-gray-300 text-gray-600">{formatTime(rec.check_in)}</td>
                  <td className="px-6 py-3 border-r border-gray-300 text-gray-600">{formatTime(rec.check_out)}</td>
                  <td className="px-6 py-3 border-r border-gray-300 text-gray-600">{rec.work_hours ? `${parseFloat(rec.work_hours).toFixed(2)}` : '00:00'}</td>
                  <td className="px-6 py-3 text-gray-600">{rec.overtime_hours ? `${parseFloat(rec.overtime_hours).toFixed(2)}` : '00:00'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, sub }) => (
  <div className="bg-white border border-gray-300 p-4 rounded shadow-sm text-center">
    <p className="text-xs font-bold text-gray-400 uppercase mb-1">{label}</p>
    <div className="flex flex-col">
      <span className="text-2xl font-bold text-gray-800">{value}</span>
      {sub && <span className="text-[10px] text-gray-400">{sub}</span>}
    </div>
  </div>
);
