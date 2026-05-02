import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Systray } from './Systray';

export const Layout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F2ED]">
        <div className="w-12 h-12 border-[3px] border-[#5C7A5F] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#6B6259] text-sm font-medium tracking-wide">Loading EmPay…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex font-sans">
      <Sidebar />
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-8 overflow-y-auto animate-fade-in-up">
          <Outlet />
        </main>
      </div>
      {/* Show Systray only on dashboard as it can be distracting on other pages */}
      {window.location.pathname === '/' && <Systray />}
    </div>
  );
};
