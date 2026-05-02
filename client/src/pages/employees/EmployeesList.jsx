import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Search, Plane, Plus } from 'lucide-react';
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
      {/* Top Header Controls */}
      <div className="flex items-center gap-4 bg-white p-2 rounded border border-gray-200">
        <button 
          onClick={() => navigate('/employees/new')}
          className="bg-[#D946EF] text-white px-6 py-1.5 rounded text-sm font-bold uppercase tracking-wider"
        >
          NEW
        </button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-4 py-1.5 text-sm focus:outline-none focus:border-primary text-center"
          />
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              className="bg-white border border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center relative cursor-pointer hover:shadow-md transition-all group"
            >
              {/* Status Indicator */}
              <div className="absolute top-3 right-3">
                <StatusIcon status={emp.presence_status} />
              </div>

              {/* Profile Pic Placeholder */}
              <div className="w-20 h-20 rounded bg-blue-100 flex items-center justify-center mb-4 overflow-hidden">
                <div className="w-16 h-16 bg-white rounded flex items-center justify-center text-primary font-bold text-2xl">
                  {emp.first_name[0]}{emp.last_name[0]}
                </div>
              </div>

              <p className="font-medium text-gray-800 text-center border-t border-gray-100 pt-2 w-full mt-2">
                [{emp.first_name} {emp.last_name}]
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
      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
        <Plane className="w-3 h-3 text-blue-600" />
      </div>
    );
  }
  
  return (
    <div className={clsx(
      "w-4 h-4 rounded-full border border-gray-300",
      status === 'PRESENT' ? 'bg-green-500' : 'bg-amber-400'
    )}></div>
  );
};
