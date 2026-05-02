import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, UserPlus, Info, Save, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export const AddEmployee = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    job_position: '',
    role: 'EMPLOYEE',
    date_of_joining: new Date().toISOString().split('T')[0],
    gender: '',
    nationality: '',
    marital_status: ''
  });
  const [loading, setLoading] = useState(false);

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
        toast.success(`Employee created! ID: ${res.data.data.login_id}`, { duration: 6000 });
        toast(`Temp Password: ${res.data.data.temp_password}`, { icon: '🔑', duration: 10000 });
        navigate('/employees');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/employees')}
          className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">New Employee</h1>
          <p className="text-gray-500 font-medium mt-1">Create a new user account and employee profile.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="bg-primary/5 p-6 border-b border-gray-100 flex gap-4 text-primary text-sm font-bold">
          <Info className="w-5 h-5 shrink-0" />
          <p>The system will auto-generate a Login ID based on the company name, employee name, and joining year. A temporary password will also be created.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <Section title="Basic Info">
              <Field label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
              <Field label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
              <Field label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" required />
              <Field label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} type="tel" />
            </Section>

            <Section title="Employment">
              <Field label="Department" name="department" value={formData.department} onChange={handleChange} />
              <Field label="Job Position" name="job_position" value={formData.job_position} onChange={handleChange} />
              <Field label="System Role" name="role" value={formData.role} onChange={handleChange} type="select" options={[
                { val: 'EMPLOYEE', label: 'Employee' },
                { val: 'HR_OFFICER', label: 'HR Officer' },
                { val: 'PAYROLL_OFFICER', label: 'Payroll Officer' },
                { val: 'ADMIN', label: 'Administrator' },
              ]} />
              <Field label="Joining Date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} type="date" required />
            </Section>

            <Section title="Additional Details">
              <Field label="Gender" name="gender" value={formData.gender} onChange={handleChange} type="select" options={[
                { val: 'Male', label: 'Male' },
                { val: 'Female', label: 'Female' },
                { val: 'Other', label: 'Other' },
              ]} />
              <Field label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
              <Field label="Marital Status" name="marital_status" value={formData.marital_status} onChange={handleChange} type="select" options={[
                { val: 'Single', label: 'Single' },
                { val: 'Married', label: 'Married' },
              ]} />
            </Section>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
            <button 
              type="button"
              onClick={() => navigate('/employees')}
              className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all"
            >
              Discard
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary hover:bg-blue-600 text-white px-10 py-3 rounded-2xl font-black shadow-lg shadow-primary/30 transition-all flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              Create Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="space-y-6">
    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
      <div className="w-1 h-4 bg-primary rounded-full"></div>
      {title}
    </h3>
    <div className="space-y-5">
      {children}
    </div>
  </div>
);

const Field = ({ label, name, value, onChange, type = "text", options = [], required = false }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputClasses = clsx(
    "w-full bg-gray-50 border rounded-2xl px-4 py-3 text-gray-900 font-bold outline-none transition-all",
    isFocused ? "border-primary ring-4 ring-primary/10 bg-white" : "border-gray-100 hover:border-gray-200"
  );

  return (
    <div>
      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {type === 'select' ? (
        <select
          name={name}
          className={inputClasses}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
        >
          <option value="">Select {label}</option>
          {options.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
        </select>
      ) : (
        <input 
          type={type}
          name={name}
          className={inputClasses}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
        />
      )}
    </div>
  );
};
