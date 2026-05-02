import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Upload, Loader2 } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans">
      <h1 className="text-2xl font-medium text-gray-700 mb-8">Human Resource Management System</h1>
      
      <div className="w-full max-w-xl bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-full h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm font-medium border border-gray-200">
            App/Web Logo
          </div>
          <h2 className="mt-6 text-xl font-medium text-gray-800">Sign Up Page</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-1 text-sm">Company Name :-</label>
              <input
                type="text"
                name="companyName"
                className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-primary transition-all"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white cursor-pointer hover:bg-blue-600 transition-colors">
              <Upload className="w-4 h-4" />
            </div>
          </div>

          {[
            { label: 'Name', name: 'name', type: 'text' },
            { label: 'Email', name: 'email', type: 'email' },
            { label: 'Phone', name: 'phone', type: 'tel' },
            { label: 'Password', name: 'password', type: 'password' },
            { label: 'Confirm Password', name: 'confirmPassword', type: 'password' },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-gray-700 font-medium mb-1 text-sm">{field.label} :-</label>
              <input
                type={field.type}
                name={field.name}
                className="w-full border-b border-gray-400 py-1 focus:outline-none focus:border-primary transition-all"
                value={formData[field.name]}
                onChange={handleChange}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 px-4 rounded shadow-md transition-all mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <Link to="/login" className="text-gray-600 hover:text-primary transition-colors">
            Already have an account ? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
