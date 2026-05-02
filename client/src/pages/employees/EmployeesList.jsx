import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Search, Plane, Plus, User } from 'lucide-react';
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
      {/* Top Header Controls - Wireframe Style */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/employees/new')}
          className="bg-[#D946EF] text-white px-8 py-2 rounded text-sm font-bold uppercase tracking-wider shadow-sm"
        >
          NEW
        </button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:border-primary text-center placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Grid View - Wireframe Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-300 rounded-lg p-6 h-48 animate-pulse"></div>
          ))
        ) : filteredEmployees.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400 font-medium italic">No employees found.</div>
        ) : (
          filteredEmployees.map((emp) => (
            <div 
              key={emp.id} 
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-white border border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center relative cursor-pointer hover:shadow-lg transition-all group"
            >
              {/* Status Indicator (Top Right Dot) */}
              <div className="absolute top-4 right-4">
                <StatusIcon status={emp.presence_status} />
              </div>

              {/* Profile Pic Placeholder */}
              <div className="w-24 h-24 bg-blue-400 rounded-sm flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-white" />
              </div>

              <p className="font-medium text-gray-600 text-center text-sm">
                {emp.first_name} {emp.last_name}
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
      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
        <Plane className="w-3 h-3 text-blue-600 fill-current" />
      </div>
    );
  }
  
  return (
    <div className={clsx(
      "w-4 h-4 rounded-full border border-gray-200 shadow-sm",
      status === 'PRESENT' ? 'bg-[#22C55E]' : 'bg-[#EAB308]'
    )}></div>
  );
};
