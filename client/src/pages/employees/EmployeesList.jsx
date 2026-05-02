import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Search, Plane, Plus, UserPlus } from 'lucide-react';
import clsx from 'clsx';

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
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2520]">Employees</h1>
          <p className="text-[#6B6259] text-sm mt-0.5">{employees.length} total team members</p>
        </div>
        {isAdminOrHR && (
          <button 
            onClick={() => navigate('/employees/new')}
            className="flex items-center gap-2 bg-[#5C7A5F] hover:bg-[#3F5C42] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-[#5C7A5F]/20 active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> New Employee
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C9286]" />
        <input 
          type="text" 
          placeholder="Search employeesâ€¦" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#FDFBF8] border border-[#DDD8CF] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#2A2520] placeholder-[#9C9286] focus:outline-none focus:border-[#5C7A5F] focus:ring-2 focus:ring-[#5C7A5F]/10 transition-all"
        />
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#FDFBF8] border border-[#DDD8CF] rounded-2xl p-6 h-48 skeleton"></div>
          ))
        ) : filteredEmployees.length === 0 ? (
          <div className="col-span-full text-center py-20 text-[#9C9286] font-medium italic">No employees found.</div>
        ) : (
          filteredEmployees.map((emp) => (
            <div 
              key={emp.id} 
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-[#FDFBF8] border border-[#DDD8CF] rounded-2xl p-6 flex flex-col items-center justify-center relative cursor-pointer hover:shadow-md hover:border-[#5C7A5F]/30 transition-all group"
            >
              {/* Status Indicator */}
              <div className="absolute top-3 right-3">
                <StatusIcon status={emp.presence_status} />
              </div>

              {/* Profile Pic Placeholder */}
              <div className="w-16 h-16 rounded-xl bg-[#5C7A5F]/10 flex items-center justify-center mb-4 overflow-hidden">
                <span className="text-[#5C7A5F] font-bold text-xl">
                  {emp.first_name[0]}{emp.last_name[0]}
                </span>
              </div>

              <p className="font-semibold text-[#2A2520] text-center text-sm group-hover:text-[#5C7A5F] transition-colors mt-1">
                {emp.first_name} {emp.last_name}
              </p>
              <p className="text-[#9C9286] text-xs mt-0.5 truncate max-w-full px-2 text-center">
                {emp.job_position || emp.department || 'Employee'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StatusIcon = ({ status }) => {
  if (status === 'ON_LEAVE') {
    return (
      <div className="w-5 h-5 rounded-full bg-[#5C7A5F]/10 flex items-center justify-center">
        <Plane className="w-3 h-3 text-[#5C7A5F]" />
      </div>
    );
  }
  
  return (
    <div className={clsx(
      "w-3.5 h-3.5 rounded-full border-2 border-[#FDFBF8]",
      status === 'PRESENT' ? 'bg-[#4A8C4E]' : 'bg-[#C28A2B]'
    )}></div>
  );
};
