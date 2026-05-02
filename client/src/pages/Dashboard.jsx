import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { 
  Users, Clock, CalendarOff, AlertTriangle, 
  ArrowRight, Play, Square, Loader2, ChevronRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, LineChart, Line 
} from 'recharts';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchDashboardData]);

  const handleCheckInOut = async (action) => {
    try {
      const res = await api.post(`/attendance/${action}`);
      if (res.data.success) {
        toast.success(action === 'check-in' ? 'Checked in successfully!' : 'Checked out successfully!');
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-10 h-10 text-[#5C7A5F] animate-spin" />
    </div>
  );

  const isAdminOrHR = ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(user?.role);

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#FDFBF8] p-7 rounded-2xl shadow-sm border border-[#DDD8CF]">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2520]">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-[#5C7A5F]">{user?.email?.split('@')[0]}</span> ðŸ‘‹
          </h1>
          <p className="text-[#6B6259] text-sm font-medium mt-1">Here's what's happening in EmPay today.</p>
        </div>
        
        {/* Check In / Out Widget */}
        <div className="flex items-center gap-5 bg-[#F5F2ED] p-4 rounded-xl border border-[#DDD8CF]">
          <div className="text-right">
            <p className="text-[10px] font-bold text-[#9C9286] uppercase tracking-widest">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            <p className="text-2xl font-bold text-[#2A2520] tabular-nums">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</p>
          </div>
          <div className="h-10 w-px bg-[#DDD8CF]"></div>
          <div className="flex gap-2">
            {!data?.todayAttendance?.check_in ? (
              <button 
                onClick={() => handleCheckInOut('check-in')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#5C7A5F] hover:bg-[#3F5C42] text-white font-semibold rounded-xl shadow-md transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" /> Check In
              </button>
            ) : !data?.todayAttendance?.check_out ? (
              <button 
                onClick={() => handleCheckInOut('check-out')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#B84040] hover:bg-[#8B2F2F] text-white font-semibold rounded-xl shadow-md transition-all active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" /> Check Out
              </button>
            ) : (
              <div className="px-5 py-2.5 bg-[#4A8C4E]/10 text-[#4A8C4E] font-semibold rounded-xl text-sm">
                âœ“ Done for Today
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdminOrHR ? (
        <AdminView data={data} navigate={navigate} />
      ) : (
        <EmployeeView data={data} navigate={navigate} />
      )}
    </div>
  );
};

/* --- ADMIN DASHBOARD --- */
const AdminView = ({ data, navigate }) => (
  <div className="space-y-8">
    {/* Counters */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Total Employees" value={data?.totalEmployees} icon={Users} color="text-[#5C7A5F]" bg="bg-[#5C7A5F]/10" />
      <StatCard title="Today's Attendance" value={data?.todayPresent} icon={Clock} color="text-[#8B7355]" bg="bg-[#8B7355]/10" />
      <StatCard title="Pending Requests" value={data?.pendingTimeOff} icon={CalendarOff} color="text-[#C28A2B]" bg="bg-[#C28A2B]/10" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Employee Cards Section */}
      <div className="lg:col-span-2 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#2A2520]">Team Overview</h2>
          <button onClick={() => navigate('/employees')} className="text-[#5C7A5F] font-semibold text-sm flex items-center gap-1 hover:text-[#3F5C42] transition-colors">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data?.employees?.map(emp => (
            <div 
              key={emp.id} 
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-[#FDFBF8] p-4 rounded-xl border border-[#DDD8CF] flex items-center gap-4 hover:shadow-md hover:border-[#5C7A5F]/30 transition-all cursor-pointer group"
            >
              <div className="relative">
                <div className="w-11 h-11 bg-[#5C7A5F]/10 rounded-xl flex items-center justify-center text-[#5C7A5F] font-bold text-sm">
                  {emp.first_name[0]}{emp.last_name[0]}
                </div>
                <div className={clsx(
                  "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#FDFBF8]",
                  emp.status === 'PRESENT' ? 'bg-[#4A8C4E]' : 
                  emp.status === 'ON_LEAVE' ? 'bg-[#B84040]' : 'bg-[#C28A2B]'
                )}></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#2A2520] truncate group-hover:text-[#5C7A5F] transition-colors text-sm">{emp.first_name} {emp.last_name}</p>
                <p className="text-xs text-[#9C9286] font-medium truncate">{emp.job_position}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payroll Summary Widget */}
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-[#2A2520]">Payroll Alerts</h2>
        <div className="bg-[#FDFBF8] p-6 rounded-2xl border border-[#DDD8CF] space-y-4 shadow-sm">
          <AlertBox 
            count={data?.warnings?.noBank} 
            label="Missing Bank Details" 
            color="text-[#C28A2B]" 
            bg="bg-[#C28A2B]/10" 
            onClick={() => navigate('/payroll')}
          />
          <AlertBox 
            count={data?.warnings?.noManager} 
            label="Employees without Manager" 
            color="text-[#5C7A5F]" 
            bg="bg-[#5C7A5F]/10" 
            onClick={() => navigate('/employees')}
          />
          <div className="pt-4 border-t border-[#EDE9E3]">
            <button 
              onClick={() => navigate('/payroll')}
              className="w-full py-3 bg-[#1C2B1E] text-white font-semibold rounded-xl hover:bg-[#2E4232] transition-all flex items-center justify-center gap-2 text-sm"
            >
              Process Payrun <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-[#FDFBF8] p-7 rounded-2xl border border-[#DDD8CF] shadow-sm">
        <h3 className="text-base font-bold text-[#2A2520] mb-6">Headcount Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.charts?.employeeChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDE9E3" />
              <XAxis dataKey="name" tick={{fill:'#9C9286', fontSize:12}} />
              <YAxis tick={{fill:'#9C9286', fontSize:12}} />
              <Tooltip contentStyle={{background:'#FDFBF8', border:'1px solid #DDD8CF', borderRadius:'12px', fontSize:12}} />
              <Legend />
              <Bar dataKey="withSalary" name="Active" fill="#5C7A5F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withoutSalary" name="New/Pending" fill="#A8C4AB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#FDFBF8] p-7 rounded-2xl border border-[#DDD8CF] shadow-sm">
        <h3 className="text-base font-bold text-[#2A2520] mb-6">Payroll Trend (Last 3 Months)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.charts?.payrunTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDE9E3" />
              <XAxis dataKey="name" tick={{fill:'#9C9286', fontSize:12}} />
              <YAxis tick={{fill:'#9C9286', fontSize:12}} />
              <Tooltip contentStyle={{background:'#FDFBF8', border:'1px solid #DDD8CF', borderRadius:'12px', fontSize:12}} />
              <Line type="monotone" dataKey="amount" name="Total Payout" stroke="#5C7A5F" strokeWidth={3} dot={{ r: 5, fill: '#5C7A5F', strokeWidth: 0 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);

/* --- EMPLOYEE DASHBOARD --- */
const EmployeeView = ({ data, navigate }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <StatCard title="Days Present (This Month)" value={data?.daysPresentThisMonth} icon={Clock} color="text-[#5C7A5F]" bg="bg-[#5C7A5F]/10" />
      <StatCard title="Available Leaves" value={data?.leaveBalance} icon={CalendarOff} color="text-[#8B7355]" bg="bg-[#8B7355]/10" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-[#FDFBF8] p-7 rounded-2xl border border-[#DDD8CF] shadow-sm">
        <h2 className="text-lg font-bold text-[#2A2520] mb-5">Recent Activity</h2>
        <div className="space-y-3">
          {data?.recentAttendance?.length > 0 ? data.recentAttendance.map(att => (
            <div key={att.id} className="flex items-center justify-between p-3.5 bg-[#F5F2ED] rounded-xl border border-[#EDE9E3]">
              <div>
                <p className="font-semibold text-[#2A2520] text-sm">{new Date(att.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                <p className="text-xs text-[#9C9286] font-medium mt-0.5">{att.status}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#5C7A5F]">{att.work_hours || 0} hrs</p>
                <p className="text-[10px] text-[#9C9286] font-bold uppercase tracking-widest">Logged</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-[#9C9286] text-sm italic">No recent attendance found.</div>
          )}
        </div>
      </div>

      <div className="bg-[#FDFBF8] p-7 rounded-2xl border border-[#DDD8CF] shadow-sm flex flex-col justify-center items-center text-center space-y-4">
        <div className="w-16 h-16 bg-[#5C7A5F]/10 text-[#5C7A5F] rounded-2xl flex items-center justify-center">
          <CalendarOff className="w-9 h-9" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#2A2520]">Plan your time off</h3>
          <p className="text-[#6B6259] text-sm font-medium max-w-xs mt-2">Check your balance and apply for leaves in advance.</p>
        </div>
        <button 
          onClick={() => navigate('/timeoff')}
          className="mt-4 px-8 py-3 bg-[#5C7A5F] hover:bg-[#3F5C42] text-white font-semibold rounded-xl shadow-md transition-all"
        >
          Manage Leaves
        </button>
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-[#FDFBF8] p-6 rounded-2xl shadow-sm border border-[#DDD8CF] flex items-center gap-5 group hover:shadow-md hover:border-[#5C7A5F]/20 transition-all">
    <div className={clsx("p-4 rounded-xl transition-transform group-hover:scale-110", bg)}>
      <Icon className={clsx("w-7 h-7", color)} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-[#9C9286] uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-bold text-[#2A2520] mt-1">{value || 0}</p>
    </div>
  </div>
);

const AlertBox = ({ count, label, color, bg, onClick }) => (
  <div 
    onClick={onClick}
    className={clsx("p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:opacity-80", bg)}
  >
    <div className="flex items-center gap-3">
      <AlertTriangle className={clsx("w-4 h-4", color)} />
      <span className={clsx("font-semibold text-sm", color)}>{label}</span>
    </div>
    <span className={clsx("w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm", color, "bg-white/60")}>
      {count || 0}
    </span>
  </div>
);
