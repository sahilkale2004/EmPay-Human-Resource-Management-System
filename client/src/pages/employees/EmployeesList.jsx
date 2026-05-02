import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Search, Plane, Plus, User, ArrowRight, MapPin, Briefcase } from 'lucide-react';
import clsx from 'clsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const EmployeesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdminOrHR = ['ADMIN', 'HR_OFFICER'].includes(user?.role);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/employees');
        if (res.data.success) {
          setEmployees(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(emp => 
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.job_position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-text">Team Directory</h1>
          <p className="text-muted text-xs font-bold uppercase tracking-widest mt-1">Manage & Connect with your colleagues</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative group flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name, role or dept..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            />
          </div>
          
          {isAdminOrHR && (
            <button 
              onClick={() => navigate('/employees/new')}
              className="bg-primary text-white p-3 rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center group"
              title="Add New Employee"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          )}
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-border rounded-[2.5rem] p-8 h-72 animate-pulse">
              <div className="w-20 h-20 bg-surface rounded-3xl mx-auto mb-4"></div>
              <div className="w-24 h-4 bg-surface rounded mx-auto mb-2"></div>
              <div className="w-16 h-3 bg-surface rounded mx-auto"></div>
            </div>
          ))
        ) : filteredEmployees.length === 0 ? (
          <div className="col-span-full py-32 bg-white border border-dashed border-border rounded-[3rem] text-center">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted opacity-20" />
            </div>
            <p className="text-muted font-bold tracking-widest uppercase text-xs">No matching team members found</p>
          </div>
        ) : (
          filteredEmployees.map((emp) => (
            <EmployeeCard key={emp.id} emp={emp} onClick={() => navigate(`/employees/${emp.id}`)} />
          ))
        )}
      </div>
    </div>
  );
};

const EmployeeCard = ({ emp, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-8 rounded-[2.5rem] border border-border flex flex-col items-center relative cursor-pointer hover:shadow-2xl hover:-translate-y-2 hover:border-primary/20 transition-all group overflow-hidden"
  >
    {/* Decorative Background Element */}
    <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

    {/* Status Indicator */}
    <div className="absolute top-6 right-6">
      <StatusBadge status={emp.presence_status} />
    </div>

    {/* Avatar */}
    <div className="relative mb-6">
      <div className="w-24 h-24 rounded-3xl bg-surface border-4 border-white shadow-xl overflow-hidden group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
        {emp.profile_picture ? (
          <img 
            src={`${API_BASE_URL}${emp.profile_picture}`} 
            alt={emp.first_name} 
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = ''; e.target.onerror = null; }}
          />
        ) : (
          <User className="w-10 h-10 text-muted opacity-30" />
        )}
      </div>
    </div>

    {/* Info */}
    <div className="text-center space-y-1 px-2">
      <h3 className="font-bold text-text text-lg leading-tight group-hover:text-primary transition-colors">
        {emp.first_name} {emp.last_name}
      </h3>
      <div className="flex items-center justify-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-[0.1em]">
        <Briefcase className="w-3 h-3" />
        {emp.job_position || 'Staff'}
      </div>
      <p className="text-[10px] text-muted font-bold uppercase tracking-widest pt-2">
        {emp.department || 'General'}
      </p>
    </div>

    {/* Footer Link */}
    <div className="mt-8 pt-6 border-t border-border/50 w-full flex items-center justify-center text-muted group-hover:text-primary transition-colors">
       <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
         View Profile <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
       </span>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const configs = {
    PRESENT: { color: 'bg-success', label: 'On Duty' },
    ON_LEAVE: { color: 'bg-secondary', label: 'On Leave', icon: Plane },
    ABSENT: { color: 'bg-error', label: 'Away' }
  };

  const config = configs[status] || configs.ABSENT;
  const Icon = config.icon;

  return (
    <div className="relative group/status">
       <div className={clsx("w-3 h-3 rounded-full border-2 border-white shadow-sm animate-pulse", config.color)}></div>
       <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-text text-white text-[8px] font-bold rounded-lg opacity-0 group-hover/status:opacity-100 transition-opacity whitespace-nowrap">
         {config.label}
       </div>
    </div>
  );
};

