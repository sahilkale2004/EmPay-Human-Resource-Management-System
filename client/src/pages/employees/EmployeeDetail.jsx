import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Building, Phone, Mail, MapPin, Briefcase } from 'lucide-react';

export const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const isAdminOrHR = ['ADMIN', 'HR_OFFICER'].includes(user?.role);
  const isPayroll = user?.role === 'PAYROLL_OFFICER';
  const canEdit = isAdminOrHR || isPayroll; // Payroll can edit salary

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await api.get(`/employees/${id}`);
        if (res.data.success) {
          setEmployee(res.data.data);
          setFormData(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load employee details');
        navigate('/employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, navigate]);

  const handleSave = async () => {
    try {
      // In a real app, we'd send only changed fields or validate thoroughly
      const res = await api.put(`/employees/${id}`, formData);
      if (res.data.success) {
        toast.success('Employee updated successfully');
        setIsEditing(false);
        setEmployee(formData);
      }
    } catch (err) {
      toast.error('Failed to update employee');
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to deactivate this employee?')) return;
    try {
      const res = await api.delete(`/employees/${id}`);
      if (res.data.success) {
        toast.success('Employee archived');
        navigate('/employees');
      }
    } catch (err) {
      toast.error('Failed to archive employee');
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-gray-500">Loading profile...</div>;
  if (!employee) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/employees')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Employees
        </button>
        <div className="flex items-center gap-3">
          {canEdit && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
            >
              Edit Profile
            </button>
          )}
          {isEditing && (
            <>
              <button 
                onClick={() => { setIsEditing(false); setFormData(employee); }}
                className="text-gray-500 hover:text-gray-700 px-4 py-2 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium"
              >
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Cover */}
        <div className="h-32 bg-gradient-to-r from-blue-100 to-indigo-100"></div>
        
        <div className="px-8 pb-8 relative">
          {/* Avatar */}
          <div className="absolute -top-16 w-32 h-32 bg-white rounded-full p-2">
            <div className="w-full h-full bg-primary text-white rounded-full flex items-center justify-center text-4xl font-bold">
              {employee.first_name[0]}{employee.last_name[0]}
            </div>
          </div>

          {/* Action Header */}
          <div className="ml-36 flex justify-between items-start pt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{employee.first_name} {employee.last_name}</h1>
              <p className="text-gray-500 font-medium mt-1 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> {employee.job_position || 'Position Not Set'}
              </p>
            </div>
            {isAdminOrHR && !isEditing && (
              <button onClick={handleArchive} className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
                Deactivate
              </button>
            )}
          </div>

          {/* Details Grid */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Column 1 */}
            <div className="space-y-6">
              <Section title="Personal Information">
                <Field label="First Name" name="first_name" value={formData.first_name} isEditing={isEditing && isAdminOrHR} onChange={setFormData} />
                <Field label="Last Name" name="last_name" value={formData.last_name} isEditing={isEditing && isAdminOrHR} onChange={setFormData} />
                <Field label="Phone" name="phone" value={formData.phone} isEditing={isEditing && isAdminOrHR} onChange={setFormData} />
                <Field label="Email" name="email" value={formData.email} isEditing={false} onChange={setFormData} />
                <Field label="Address" name="address" value={formData.address} isEditing={isEditing && isAdminOrHR} onChange={setFormData} type="textarea" />
              </Section>
            </div>

            {/* Column 2 */}
            <div className="space-y-6">
              <Section title="Employment Details">
                <Field label="Login ID" name="login_id" value={formData.login_id} isEditing={false} onChange={setFormData} />
                <Field label="Department" name="department" value={formData.department} isEditing={isEditing && isAdminOrHR} onChange={setFormData} />
                <Field label="Date of Joining" name="date_of_joining" value={formData.date_of_joining?.split('T')[0]} isEditing={isEditing && isAdminOrHR} onChange={setFormData} type="date" />
                <Field label="Bank Name" name="bank_name" value={formData.bank_name} isEditing={isEditing && isAdminOrHR} onChange={setFormData} />
                <Field label="Account Number" name="bank_account_number" value={formData.bank_account_number} isEditing={isEditing && isAdminOrHR} onChange={setFormData} />
              </Section>

              {(isAdminOrHR || isPayroll || user.employee_id === parseInt(id)) && employee.salary_structure && (
                <Section title="Salary Structure">
                  <Field label="Wage Type" name="salary_structure.wage_type" value={formData.salary_structure?.wage_type} isEditing={false} onChange={setFormData} />
                  <Field label="Monthly Wage" name="salary_structure.monthly_wage" value={formData.salary_structure?.monthly_wage} isEditing={false} onChange={setFormData} />
                  <Field label="Basic (%)" name="salary_structure.basic_pct" value={formData.salary_structure?.basic_pct} isEditing={false} onChange={setFormData} />
                  {/* More salary fields can go here. For full edit, maybe a separate modal is better */}
                </Section>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100">
    <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const Field = ({ label, name, value, isEditing, onChange, type = "text" }) => {
  if (!isEditing) {
    return (
      <div>
        <span className="block text-sm font-medium text-gray-500 mb-1">{label}</span>
        <span className="block text-gray-900">{value || '-'}</span>
      </div>
    );
  }

  // Handle nested state like salary_structure.wage_type if needed
  const handleChange = (e) => {
    const val = e.target.value;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      onChange(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: val } }));
    } else {
      onChange(prev => ({ ...prev, [name]: val }));
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea 
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          value={value || ''}
          onChange={handleChange}
          rows="2"
        />
      ) : (
        <input 
          type={type}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          value={value || ''}
          onChange={handleChange}
        />
      )}
    </div>
  );
};
