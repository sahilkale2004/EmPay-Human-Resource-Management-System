import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Banknote, Loader2, User } from 'lucide-react';
import PasswordInput from '../components/ui/PasswordInput';

export const Login = () => {
  const { user, login } = useAuth();
  const [loginIdOrEmail, setLoginIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdOrEmail || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { loginIdOrEmail, password });
      if (response.data.success) {
        toast.success('Login successful!');
        login(response.data.data.token, response.data.data.user);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex font-sans">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1C2B1E] flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle at 30% 20%, #5C7A5F 0%, transparent 60%), radial-gradient(circle at 70% 80%, #8B7355 0%, transparent 60%)'}}></div>
        <div className="relative z-10 text-center max-w-xs">
          <div className="w-16 h-16 bg-[#5C7A5F] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Banknote className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 leading-tight" style={{fontFamily:'Playfair Display, serif'}}>
            <span className="italic">EmPay</span> HRMS
          </h1>
          <p className="text-[#A8C4AB] text-base leading-relaxed">
            Streamline your workforce. Manage employees, attendance, payroll & more — all in one place.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {['Employees', 'Attendance', 'Payroll', 'Time Off'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-[#7FA882] text-sm">
                <div className="w-1.5 h-1.5 bg-[#5C7A5F] rounded-full"></div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-[#5C7A5F] rounded-xl flex items-center justify-center">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1C2B1E]">EmPay</span>
          </div>

          <h2 className="text-2xl font-bold text-[#2A2520] mb-1">Welcome back</h2>
          <p className="text-[#6B6259] text-sm mb-8">Sign in to your HR Management System account</p>

          <div className="bg-[#FDFBF8] border border-[#DDD8CF] rounded-2xl p-8 shadow-[0_4px_24px_rgba(92,122,95,0.08)]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[#2A2520] text-sm font-semibold mb-1.5">Login ID / Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C9286]" />
                  <input
                    type="text"
                    className="w-full bg-[#F5F2ED] border border-[#DDD8CF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2A2520] placeholder-[#9C9286] focus:outline-none focus:border-[#5C7A5F] focus:ring-2 focus:ring-[#5C7A5F]/15 transition-all"
                    placeholder="Enter your Login ID or email"
                    value={loginIdOrEmail}
                    onChange={(e) => setLoginIdOrEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#5C7A5F] hover:bg-[#3F5C42] text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-[#5C7A5F]/20 transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sign In'}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-sm">
            <Link to="/signup" className="text-[#5C7A5F] hover:text-[#3F5C42] font-medium transition-colors">
              Don't have an account? <span className="underline">Sign Up</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
