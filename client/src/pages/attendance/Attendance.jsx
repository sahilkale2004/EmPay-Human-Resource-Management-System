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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2A2520]">Attendance</h1>
        <p className="text-[#6B6259] text-sm mt-0.5">{isAdminView ? 'Team attendance overview' : 'Your attendance records'}</p>
      </div>

      {/* Controls Header */}
      <div className="flex flex-wrap items-center gap-3 bg-[#FDFBF8] p-3 rounded-xl border border-[#DDD8CF] shadow-sm">
        <div className="flex border border-[#DDD8CF] rounded-lg overflow-hidden">
          <button onClick={handlePrevDate} className="p-2 hover:bg-[#EDE9E3] border-r border-[#DDD8CF] transition-colors">
            <ChevronLeft className="w-4 h-4 text-[#6B6259]" />
          </button>
          <button onClick={handleNextDate} className="p-2 hover:bg-[#EDE9E3] transition-colors">
            <ChevronRight className="w-4 h-4 text-[#6B6259]" />
          </button>
        </div>

        <div className="px-4 py-1.5 bg-[#5C7A5F]/10 border border-[#5C7A5F]/20 rounded-lg text-sm font-semibold text-[#3F5C42]">
          {currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        <div className="px-4 py-1.5 border border-[#DDD8CF] rounded-lg text-sm font-medium bg-[#F5F2ED] text-[#6B6259]">
          {currentDate.toLocaleDateString('en-GB', { weekday: 'long' })}
        </div>

        {isAdminView && (
          <div className="flex-1 max-w-xs relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C9286]" />
            <input 
              type="text" 
              placeholder="Search employee…" 
              className="w-full bg-[#F5F2ED] border border-[#DDD8CF] rounded-lg pl-9 pr-4 py-1.5 text-sm text-[#2A2520] placeholder-[#9C9286] focus:outline-none focus:border-[#5C7A5F] transition-all"
            />
          </div>
        )}
      </div>

      {!isAdminView && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Out of" value="22" sub="days present" />
          <StatBox label="Current count" value={records.length} />
          <StatBox label="Total working days" value="24" />
        </div>
      )}

      {/* Table */}
      <div className="bg-[#FDFBF8] border border-[#DDD8CF] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-[#F5F2ED] border-b border-[#DDD8CF]">
              {isAdminView ? (
                <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Employee</th>
              ) : (
                <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Date</th>
              )}
              <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Check In</th>
              <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Check Out</th>
              <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Work Hours</th>
              <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Extra Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDE9E3]">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-[#9C9286] text-sm italic">Loading attendance…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-[#9C9286] text-sm italic">No records for this date.</td></tr>
            ) : (
              records.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#F5F2ED] transition-colors">
                  <td className="px-6 py-3.5 border-r border-[#EDE9E3] text-[#2A2520] font-medium text-sm">
                    {isAdminView ? `${rec.first_name} ${rec.last_name}` : new Date(rec.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3.5 border-r border-[#EDE9E3] text-[#5C7A5F] font-semibold">{formatTime(rec.check_in)}</td>
                  <td className="px-6 py-3.5 border-r border-[#EDE9E3] text-[#B84040] font-semibold">{formatTime(rec.check_out)}</td>
                  <td className="px-6 py-3.5 border-r border-[#EDE9E3] text-[#2A2520]">{rec.work_hours ? `${parseFloat(rec.work_hours).toFixed(2)} h` : '—'}</td>
                  <td className="px-6 py-3.5 text-[#8B7355]">{rec.overtime_hours ? `${parseFloat(rec.overtime_hours).toFixed(2)} h` : '—'}</td>
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
  <div className="bg-[#FDFBF8] border border-[#DDD8CF] p-5 rounded-2xl shadow-sm text-center">
    <p className="text-[10px] font-bold text-[#9C9286] uppercase tracking-widest mb-2">{label}</p>
    <div className="flex flex-col">
      <span className="text-3xl font-bold text-[#2A2520]">{value}</span>
      {sub && <span className="text-[10px] text-[#9C9286] mt-0.5">{sub}</span>}
    </div>
  </div>
);

