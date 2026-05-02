import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Upload, Loader2, Banknote } from 'lucide-react';

export const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', formData);

      if (response.data.success) {
        toast.success(`Account created! ID: ${response.data.data.login_id}`, { duration: 6000 });
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-[#F5F2ED] border border-[#DDD8CF] rounded-xl px-4 py-2.5 text-sm text-[#2A2520] placeholder-[#9C9286] focus:outline-none focus:border-[#5C7A5F] focus:ring-2 focus:ring-[#5C7A5F]/15 transition-all";
  const labelClass = "block text-[#2A2520] text-sm font-semibold mb-1.5";

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex flex-col items-center justify-center p-6 font-sans">
      {/* Brand header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#5C7A5F] rounded-xl flex items-center justify-center shadow-md">
          <Banknote className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-xl font-bold text-[#1C2B1E]">EmPay HRMS</p>
          <p className="text-[10px] text-[#6B6259] font-medium uppercase tracking-widest">Human Resource Management</p>
        </div>
      </div>
      
      <div className="w-full max-w-xl bg-[#FDFBF8] border border-[#DDD8CF] rounded-2xl p-8 shadow-[0_4px_24px_rgba(92,122,95,0.08)]">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#2A2520]">Create your organisation</h2>
          <p className="text-[#6B6259] text-sm mt-1">Set up your HR workspace and admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className={labelClass}>Company Name</label>
              <input
                type="text"
                name="companyName"
                className={inputClass}
                placeholder="Your company name"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>
            <div className="w-10 h-10 bg-[#5C7A5F] rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-[#3F5C42] transition-colors shrink-0 mb-0.5">
              <Upload className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: 'Full Name', name: 'name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email Address', name: 'email', type: 'email', placeholder: 'admin@company.com' },
              { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
            ].map((field) => (
              <div key={field.name} className={field.name === 'name' ? '' : ''}>
                <label className={labelClass}>{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  className={inputClass}
                  placeholder={field.placeholder}
                  value={formData[field.name]}
                  onChange={handleChange}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                name="password"
                className={inputClass}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className={inputClass}
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#5C7A5F] hover:bg-[#3F5C42] text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-[#5C7A5F]/20 transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-[#5C7A5F] hover:text-[#3F5C42] font-medium transition-colors">
            Already have an account? <span className="underline">Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
