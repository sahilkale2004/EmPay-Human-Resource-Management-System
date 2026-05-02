import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, UserPlus } from 'lucide-react';

export const AddEmployee = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    job_position: '',
    role: 'EMPLOYEE',
    date_of_joining: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  // Protection
  if (!['ADMIN', 'HR_OFFICER'].includes(user?.role)) {
    navigate('/employees');
    return null;
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/employees', formData);
      if (res.data.success) {
        toast.success(`Employee created! Temporary password: ${res.data.data.temp_password}`, { duration: 6000 });
        navigate('/employees');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/employees')}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input required type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input required type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Position</label>
              <input type="text" name="job_position" value={formData.job_position} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary">
                <option value="EMPLOYEE">Employee</option>
                <option value="PAYROLL_OFFICER">Payroll Officer</option>
                <option value="HR_OFFICER">HR Officer</option>
                {user?.role === 'ADMIN' && <option value="ADMIN">Administrator</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
              <input type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
