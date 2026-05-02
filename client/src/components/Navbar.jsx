import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center">
        {/* Placeholder for future breadcrumbs or mobile menu toggle */}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-semibold text-gray-900">{user?.email}</p>
            <p className="text-gray-500 text-xs">{user?.role ? user.role.replace('_', ' ') : ''}</p>
          </div>
        </div>
        
        <div className="h-8 w-px bg-gray-200 mx-2"></div>
        
        <button 
          onClick={logout}
          className="p-2 text-gray-500 hover:text-error hover:bg-red-50 rounded-full transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
