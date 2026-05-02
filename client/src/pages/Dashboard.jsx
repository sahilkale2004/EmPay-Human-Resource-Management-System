import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { 
  Users, Clock, CalendarOff, AlertTriangle, 
  ArrowRight, Play, Square, Loader2, ChevronRight,
  Search, TrendingUp, Filter, User
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area 
} from 'recharts';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
  }, [fetchDashboardData]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
  );

  const isAdminOrHR = ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(user?.role);
  const filteredEmployees = data?.employees?.filter(emp => 
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.job_position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Welcome Header */}
      <div className="bg-card p-8 rounded-3xl shadow-sm border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-text">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-primary font-display italic tracking-wide">{user?.login_id || user?.email?.split('@')[0]}</span> ✨
          </h1>
          <p className="text-muted text-sm font-medium mt-2">Here's your organization overview for today.</p>
        </div>
        {!isAdminOrHR && (
          <div className="flex gap-3">
             {/* Quick Actions for Employees could go here */}
          </div>
        )}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-blob"></div>
      </div>

      {isAdminOrHR ? (
        <AdminView data={data} filteredEmployees={filteredEmployees} searchQuery={searchQuery} setSearchQuery={setSearchQuery} navigate={navigate} />
      ) : (
        <EmployeeView data={data} navigate={navigate} />
      )}
    </div>
  );
};

const AdminView = ({ data, filteredEmployees, searchQuery, setSearchQuery, navigate }) => (
  <div className="space-y-10">
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Staff" value={data?.totalEmployees} icon={Users} color="text-primary" bg="bg-primary/10" trend="+4% this month" />
      <StatCard title="On Duty" value={data?.todayPresent} icon={Clock} color="text-secondary" bg="bg-secondary/10" trend="92% capacity" />
      <StatCard title="On Leave" value={data?.totalEmployees - data?.todayPresent} icon={CalendarOff} color="text-error" bg="bg-error/10" />
      <StatCard title="Pending Review" value={data?.pendingTimeOff} icon={AlertTriangle} color="text-warning" bg="bg-warning/10" />
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
      {/* Team Overview with Search */}
      <div className="xl:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-text flex items-center gap-2">
            <div className="w-2 h-8 bg-primary rounded-full"></div>
            Team Management
          </h2>
          <div className="relative group w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Search by name or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
          {filteredEmployees?.length > 0 ? filteredEmployees.map(emp => (
            <EmployeeCard key={emp.id} emp={emp} navigate={navigate} />
          )) : (
            <div className="col-span-full py-20 bg-card border border-dashed border-border rounded-3xl text-center text-muted italic">
              No team members match your search.
            </div>
          )}
        </div>
      </div>

      {/* Side Widgets */}
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-text">Critical Alerts</h2>
          <div className="bg-card p-6 rounded-3xl border border-border space-y-4 shadow-sm">
            <AlertItem 
              count={data?.warnings?.noBank} 
              label="Bank details missing" 
              color="text-warning" 
              bg="bg-warning/10" 
              onClick={() => navigate('/payroll')}
            />
            <AlertItem 
              count={data?.warnings?.noManager} 
              label="Manager not assigned" 
              color="text-primary" 
              bg="bg-primary/10" 
              onClick={() => navigate('/employees')}
            />
            <div className="pt-4 border-t border-border mt-2">
              <button 
                onClick={() => navigate('/payroll')}
                className="w-full py-4 bg-sidebar text-white font-bold rounded-2xl hover:bg-primary-dark transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/10"
              >
                Launch Payroll Run <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Quick Insights */}
        <section className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-text text-sm">Monthly Insight</h3>
          </div>
          <p className="text-text-soft text-sm leading-relaxed font-medium">
            Retention rate is up by <span className="text-success font-bold">2.4%</span> since last quarter. New employee engagement is at an all-time high.
          </p>
        </section>
      </div>
    </div>

    {/* Analytics Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-text">Headcount Dynamics</h3>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full text-[10px] font-bold text-muted border border-border">
            <Filter className="w-3 h-3" /> BY DEPARTMENT
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.charts?.employeeChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDE9E3" />
              <XAxis dataKey="name" tick={{fill:'#9C9286', fontSize:11, fontWeight:600}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fill:'#9C9286', fontSize:11, fontWeight:600}} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                cursor={{fill: 'rgba(92, 122, 95, 0.05)'}}
                contentStyle={{background:'#FDFBF8', border:'1px solid #DDD8CF', borderRadius:'16px', fontSize:11, padding:'12px', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.05)'}} 
              />
              <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize:'11px', fontWeight:'600'}} />
              <Bar dataKey="withSalary" name="Active Staff" fill="#5C7A5F" radius={[6, 6, 0, 0]} barSize={32} />
              <Bar dataKey="withoutSalary" name="Onboarding" fill="#A8C4AB" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-text">Financial Projection</h3>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-full text-[10px] font-bold text-muted border border-border">
            <TrendingUp className="w-3 h-3" /> TOTAL PAYOUT
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.charts?.payrunTrend}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5C7A5F" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#5C7A5F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDE9E3" />
              <XAxis dataKey="name" tick={{fill:'#9C9286', fontSize:11, fontWeight:600}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fill:'#9C9286', fontSize:11, fontWeight:600}} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip contentStyle={{background:'#FDFBF8', border:'1px solid #DDD8CF', borderRadius:'16px', fontSize:11, padding:'12px'}} />
              <Area type="monotone" dataKey="amount" name="Net Payout" stroke="#5C7A5F" strokeWidth={4} fillOpacity={1} fill="url(#colorAmount)" dot={{ r: 6, fill: '#5C7A5F', strokeWidth: 0 }} activeDot={{ r: 8 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);

const EmployeeCard = ({ emp, navigate }) => (
  <div 
    onClick={() => navigate(`/employees/${emp.id}`)}
    className="bg-card p-5 rounded-3xl border border-border flex items-center gap-5 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
  >
    <div className="relative shrink-0">
      <div className="w-16 h-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-surface flex items-center justify-center group-hover:scale-105 transition-transform">
        {emp.profile_picture ? (
          <img 
            src={`${API_BASE_URL}${emp.profile_picture}`} 
            alt={emp.first_name} 
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = ''; e.target.onerror = null; }}
          />
        ) : (
          <User className="w-8 h-8 text-muted opacity-30" />
        )}
      </div>
      <div className={clsx(
        "absolute bottom-0 right-0 w-4 h-4 rounded-full border-4 border-card",
        emp.presence_status === 'PRESENT' ? 'bg-success' : 
        emp.presence_status === 'ON_LEAVE' ? 'bg-error' : 'bg-warning'
      )}></div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-text truncate group-hover:text-primary transition-colors">{emp.first_name} {emp.last_name}</p>
      <p className="text-xs text-muted font-bold uppercase tracking-wider mt-1">{emp.job_position || 'Staff member'}</p>
    </div>
    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
       <ArrowRight className="w-4 h-4 text-primary" />
    </div>
  </div>
);

const EmployeeView = ({ data, navigate }) => (
  <div className="space-y-8 animate-fade-in-up">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <StatCard title="Active Days" value={data?.daysPresentThisMonth} icon={Clock} color="text-primary" bg="bg-primary/10" trend="This month" />
      <StatCard title="Leave Credits" value={data?.leaveBalance} icon={CalendarOff} color="text-secondary" bg="bg-secondary/10" trend="Available" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
        <h2 className="text-xl font-bold text-text mb-8 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-primary rounded-full"></div>
          Recent Presence
        </h2>
        <div className="space-y-4">
          {data?.recentAttendance?.length > 0 ? data.recentAttendance.map(att => (
            <div key={att.id} className="flex items-center justify-between p-5 bg-surface rounded-2xl border border-border/50 hover:bg-white hover:shadow-md transition-all">
              <div>
                <p className="font-bold text-text">{new Date(att.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">{att.status}</p>
              </div>
              <div className="text-right bg-white px-4 py-2 rounded-xl border border-border shadow-sm">
                <p className="text-sm font-bold text-primary">{att.work_hours || 0}h logged</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-16 text-muted italic font-medium">No recent logs found.</div>
          )}
        </div>
      </div>

      <div className="bg-card p-10 rounded-3xl border border-border shadow-sm flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center shadow-inner">
          <CalendarOff className="w-10 h-10" />
        </div>
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-text">Time for a break?</h3>
          <p className="text-text-soft text-sm font-medium max-w-xs mt-3">Request your leaves and plan your downtime with ease.</p>
        </div>
        <button 
          onClick={() => navigate('/timeoff')}
          className="mt-6 px-10 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95"
        >
          Request Time Off
        </button>
        <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-secondary/5 rounded-full blur-2xl"></div>
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, icon: Icon, color, bg, trend }) => (
  <div className="bg-card p-7 rounded-3xl shadow-sm border border-border flex items-center gap-6 group hover:shadow-xl hover:border-primary/10 transition-all relative overflow-hidden">
    <div className={clsx("p-5 rounded-2xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110", bg)}>
      <Icon className={clsx("w-8 h-8", color)} />
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{title}</p>
      <p className="text-3xl font-bold text-text mt-1.5">{value || 0}</p>
      {trend && <p className="text-[10px] font-bold text-success mt-1">{trend}</p>}
    </div>
    <div className="absolute right-[-20%] bottom-[-20%] w-32 h-32 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
  </div>
);

const AlertItem = ({ count, label, color, bg, onClick }) => (
  <div 
    onClick={onClick}
    className={clsx("p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:bg-white hover:shadow-md border border-transparent hover:border-border", bg)}
  >
    <div className="flex items-center gap-3">
      <AlertTriangle className={clsx("w-4 h-4", color)} />
      <span className={clsx("font-bold text-xs uppercase tracking-wide", color)}>{label}</span>
    </div>
    <span className={clsx("w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner", color, "bg-white/80")}>
      {count || 0}
    </span>
  </div>
);
