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
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  const isAdminOrHR = ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(user?.role);

  return (
    <div className="space-y-10 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Welcome, {user?.email.split('@')[0]}! 👋
          </h1>
          <p className="text-gray-500 font-medium mt-1">Here's what's happening in EmPay today.</p>
        </div>
        
        {/* Check In / Out Widget */}
        <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            <p className="text-2xl font-black text-gray-900 tabular-nums">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</p>
          </div>
          <div className="h-10 w-px bg-gray-200"></div>
          <div className="flex gap-2">
            {!data?.todayAttendance?.check_in ? (
              <button 
                onClick={() => handleCheckInOut('check-in')}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" /> Check In
              </button>
            ) : !data?.todayAttendance?.check_out ? (
              <button 
                onClick={() => handleCheckInOut('check-out')}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" /> Check Out
              </button>
            ) : (
              <div className="px-5 py-2.5 bg-gray-200 text-gray-500 font-bold rounded-xl">
                Done for Today
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
  <div className="space-y-10">
    {/* Counters */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <StatCard title="Total Employees" value={data?.totalEmployees} icon={Users} color="text-blue-600" bg="bg-blue-50" />
      <StatCard title="Today's Attendance" value={data?.todayPresent} icon={Clock} color="text-green-600" bg="bg-green-50" />
      <StatCard title="Pending Requests" value={data?.pendingTimeOff} icon={CalendarOff} color="text-orange-600" bg="bg-orange-50" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Employee Cards Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Team Overview</h2>
          <button onClick={() => navigate('/employees')} className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data?.employees?.map(emp => (
            <div 
              key={emp.id} 
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="relative">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                  {emp.first_name[0]}{emp.last_name[0]}
                </div>
                <div className={clsx(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                  emp.status === 'PRESENT' ? 'bg-green-500' : 
                  emp.status === 'ON_LEAVE' ? 'bg-red-500' : 'bg-amber-400'
                )}></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{emp.first_name} {emp.last_name}</p>
                <p className="text-xs text-gray-500 font-medium truncate">{emp.job_position}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payroll Summary Widget */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Payroll Alerts</h2>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
          <AlertBox 
            count={data?.warnings?.noBank} 
            label="Missing Bank Details" 
            color="text-amber-700" 
            bg="bg-amber-50" 
            onClick={() => navigate('/payroll')}
          />
          <AlertBox 
            count={data?.warnings?.noManager} 
            label="Employees without Manager" 
            color="text-blue-700" 
            bg="bg-blue-50" 
            onClick={() => navigate('/employees')}
          />
          <div className="pt-4 border-t border-gray-100">
            <button 
              onClick={() => navigate('/payroll')}
              className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              Process Payrun <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-6">Headcount Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.charts?.employeeChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="withSalary" name="Active" fill="#6C47FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withoutSalary" name="New/Pending" fill="#C7D2FE" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-6">Payroll Trend (Last 3 Months)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.charts?.payrunTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" name="Total Payout" stroke="#6C47FF" strokeWidth={4} dot={{ r: 6, fill: '#6C47FF' }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);

/* --- EMPLOYEE DASHBOARD --- */
const EmployeeView = ({ data, navigate }) => (
  <div className="space-y-10">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <StatCard title="Days Present (This Month)" value={data?.daysPresentThisMonth} icon={Clock} color="text-green-600" bg="bg-green-50" />
      <StatCard title="Available Leaves" value={data?.leaveBalance} icon={CalendarOff} color="text-blue-600" bg="bg-blue-50" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {data?.recentAttendance?.length > 0 ? data.recentAttendance.map(att => (
            <div key={att.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-bold text-gray-900">{new Date(att.date).toLocaleDateString()}</p>
                <p className="text-xs text-gray-500 font-medium">{att.status}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-primary">{att.work_hours || 0} Hours</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Logged</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-gray-400 italic">No recent attendance found.</div>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
          <CalendarOff className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">Plan your time off</h3>
          <p className="text-gray-500 font-medium max-w-xs mt-2">Check your balance and apply for leaves in advance.</p>
        </div>
        <button 
          onClick={() => navigate('/timeoff')}
          className="mt-4 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all"
        >
          Manage Leaves
        </button>
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all">
    <div className={clsx("p-5 rounded-2xl transition-transform group-hover:scale-110", bg)}>
      <Icon className={clsx("w-8 h-8", color)} />
    </div>
    <div>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-4xl font-black text-gray-900 mt-1">{value || 0}</p>
    </div>
  </div>
);

const AlertBox = ({ count, label, color, bg, onClick }) => (
  <div 
    onClick={onClick}
    className={clsx("p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:opacity-80", bg)}
  >
    <div className="flex items-center gap-3">
      <AlertTriangle className={clsx("w-5 h-5", color)} />
      <span className={clsx("font-bold text-sm", color)}>{label}</span>
    </div>
    <span className={clsx("w-8 h-8 rounded-full flex items-center justify-center font-black text-sm", color, "bg-white/50")}>
      {count || 0}
    </span>
  </div>
);
