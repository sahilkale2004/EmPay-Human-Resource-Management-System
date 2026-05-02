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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans">
      <Sidebar />
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {/* Show Systray for all roles as it provides status and quick check-in */}
      <Systray />
    </div>
  );
};
