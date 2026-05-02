import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Search, Users, Clock } from 'lucide-react';
import clsx from 'clsx';

export const Attendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  const isAdminView = ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(user?.role);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
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

  const filteredRecords = records.filter(rec => {
    if (!isAdminView) return true;
    const fullName = `${rec.first_name} ${rec.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Header & Navigation */}
      <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Attendance</h1>
          <p className="text-muted text-xs font-bold uppercase tracking-widest mt-1">
            {isAdminView ? 'Team attendance overview' : 'Your attendance records'}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-surface p-2 rounded-2xl border border-border">
          <div className="flex bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <button onClick={handlePrevDate} className="p-2.5 hover:bg-surface border-r border-border transition-colors text-muted hover:text-primary">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={handleNextDate} className="p-2.5 hover:bg-surface transition-colors text-muted hover:text-primary">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 py-2.5 bg-white border border-border rounded-xl shadow-sm text-sm font-bold text-text flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            {currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Stats or Search */}
        <div className="w-full lg:w-80 space-y-6">
          {isAdminView && (
            <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm space-y-4">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-1">Quick Search</p>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Employee name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface border border-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
                />
              </div>
            </div>
          )}

          <div className={clsx("grid gap-4", isAdminView ? "grid-cols-1" : "grid-cols-1")}>
             <StatBox label="Active Workforce" value={records.length} icon={Users} color="text-primary" bg="bg-primary/5" />
             {!isAdminView && (
               <>
                 <StatBox label="Days Present" value="22" sub="Out of 24" icon={Clock} color="text-secondary" bg="bg-secondary/5" />
                 <StatBox label="Total Hours" value="176" icon={Clock} color="text-warning" bg="bg-warning/5" />
               </>
             )}
          </div>
        </div>

        {/* Right Column: Table */}
        <div className="flex-1 bg-white border border-border rounded-[2.5rem] overflow-hidden shadow-sm h-fit">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="px-6 py-4 font-bold text-muted text-[10px] uppercase tracking-widest">
                  {isAdminView ? 'Employee' : 'Date'}
                </th>
                <th className="px-6 py-4 font-bold text-muted text-[10px] uppercase tracking-widest text-center">Check In</th>
                <th className="px-6 py-4 font-bold text-muted text-[10px] uppercase tracking-widest text-center">Check Out</th>
                <th className="px-6 py-4 font-bold text-muted text-[10px] uppercase tracking-widest text-center">Work Hours</th>
                <th className="px-6 py-4 font-bold text-muted text-[10px] uppercase tracking-widest text-center">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted text-sm italic">Loading attendance records...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center space-y-3">
                  <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Search className="w-6 h-6 text-muted" />
                  </div>
                  <p className="text-muted text-xs font-bold uppercase tracking-widest">No matching records found</p>
                </td></tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-primary font-bold text-[10px] border border-border shadow-sm">
                           {isAdminView ? rec.first_name[0] + rec.last_name[0] : 'AT'}
                         </div>
                         <span className="text-text font-bold">
                           {isAdminView ? `${rec.first_name} ${rec.last_name}` : new Date(rec.date).toLocaleDateString()}
                         </span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-success text-xs bg-success/5 border-x border-border/10">
                      {formatTime(rec.check_in)}
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-error text-xs bg-error/5 border-r border-border/10">
                      {formatTime(rec.check_out)}
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-text text-sm">
                      {rec.work_hours ? `${parseFloat(rec.work_hours).toFixed(1)}h` : '—'}
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className={clsx(
                         "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                         rec.overtime_hours > 0 ? "bg-warning/10 text-warning" : "text-muted opacity-30"
                       )}>
                         {rec.overtime_hours ? `${parseFloat(rec.overtime_hours).toFixed(1)}h` : 'No OT'}
                       </span>
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

const StatBox = ({ label, value, sub, icon: Icon, color, bg }) => (
  <div className="bg-white border border-border p-6 rounded-[2rem] shadow-sm flex items-center gap-5 group hover:shadow-xl hover:border-primary/20 transition-all overflow-hidden relative">
    <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6", bg, color)}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold text-text">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</span>
        {sub && <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{sub}</span>}
      </div>
    </div>
    <div className="absolute right-[-20%] bottom-[-20%] w-20 h-20 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
  </div>
);

