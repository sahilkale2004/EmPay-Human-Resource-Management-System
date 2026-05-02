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
          className="p-2 text-[#9C9286] hover:bg-[#EDE9E3] rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#2A2520]">New Employee</h1>
          <p className="text-[#6B6259] text-sm mt-0.5">Create a new user account and employee profile.</p>
        </div>
      </div>

      <div className="bg-[#FDFBF8] rounded-2xl shadow-sm border border-[#DDD8CF] overflow-hidden">
        <div className="bg-[#5C7A5F]/5 border-[#5C7A5F]/15 border-b p-5 flex gap-3 text-[#3F5C42] text-sm">
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#5C7A5F]" />
          <p>The system will auto-generate a Login ID based on the company name, employee name, and joining year. A temporary password will also be created.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
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

          <div className="flex justify-end gap-4 pt-8 border-t border-[#EDE9E3]">
            <button 
              type="button"
              onClick={() => navigate('/employees')}
              className="px-6 py-3 text-[#6B6259] font-semibold hover:bg-[#EDE9E3] rounded-xl transition-all"
            >
              Discard
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#5C7A5F] hover:bg-[#3F5C42] text-white px-8 py-3 rounded-xl font-semibold shadow-md shadow-[#5C7A5F]/20 transition-all flex items-center gap-2 active:scale-[0.98] disabled:opacity-70"
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
  <div className="space-y-5">
    <h3 className="text-[10px] font-bold text-[#9C9286] uppercase tracking-widest flex items-center gap-2">
      <div className="w-1 h-3.5 bg-[#5C7A5F] rounded-full"></div>
      {title}
    </h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const Field = ({ label, name, value, onChange, type = "text", options = [], required = false }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputClasses = clsx(
    "w-full bg-[#F5F2ED] border rounded-xl px-4 py-2.5 text-[#2A2520] font-medium outline-none transition-all text-sm",
    isFocused ? "border-[#5C7A5F] ring-2 ring-[#5C7A5F]/10 bg-[#FDFBF8]" : "border-[#DDD8CF] hover:border-[#B8B0A5]"
  );

  return (
    <div>
      <label className="block text-[10px] font-bold text-[#9C9286] uppercase tracking-widest mb-1.5 px-0.5">
        {label} {required && <span className="text-[#B84040]">*</span>}
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
