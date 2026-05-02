import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Users, Clock, CalendarOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="animate-pulse flex space-x-4"><div className="h-4 bg-gray-200 rounded w-1/4"></div></div>;
  }

  const isAdminOrHR = ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.email.split('@')[0]}!</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {isAdminOrHR ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Employees" 
            value={stats?.totalEmployees || 0} 
            icon={Users} 
            color="bg-blue-50 text-blue-600" 
          />
          <StatCard 
            title="Today's Attendance" 
            value={stats?.todayPresent || 0} 
            icon={Clock} 
            color="bg-green-50 text-green-600" 
          />
          <StatCard 
            title="Pending Time Off" 
            value={stats?.pendingTimeOff || 0} 
            icon={CalendarOff} 
            color="bg-orange-50 text-orange-600" 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard 
            title="Days Present (This Month)" 
            value={stats?.daysPresentThisMonth || 0} 
            icon={Clock} 
            color="bg-green-50 text-green-600" 
          />
          <StatCard 
            title="Pending Leaves" 
            value={stats?.pendingLeaves || 0} 
            icon={AlertCircle} 
            color="bg-orange-50 text-orange-600" 
          />
        </div>
      )}

      {/* Placeholder for future charts/widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px] flex flex-col items-center justify-center text-gray-400">
          <p>Recent Activity Widget</p>
          <p className="text-xs mt-2">(Coming Soon)</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px] flex flex-col items-center justify-center text-gray-400">
          <p>Upcoming Birthdays / Anniversaries</p>
          <p className="text-xs mt-2">(Coming Soon)</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  </div>
);
