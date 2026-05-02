import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Banknote, User, Lock, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans">
      <h1 className="text-2xl font-medium text-gray-700 mb-8">Human Resource Management System</h1>
      
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-full h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm font-medium border border-gray-200">
            App/Web Logo
          </div>
          <h2 className="mt-6 text-xl font-medium text-gray-800">Sign in Page</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Login Id/Email :-</label>
            <input
              type="text"
              className="w-full border border-gray-400 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              value={loginIdOrEmail}
              onChange={(e) => setLoginIdOrEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Password :-</label>
            <input
              type="password"
              className="w-full border border-gray-400 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 px-4 rounded shadow-md transition-all uppercase tracking-wider"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'SIGN IN'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <Link to="/signup" className="text-gray-600 hover:text-primary transition-colors">
            Don't have an Account? Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
