import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('empay_user');
    const token = localStorage.getItem('empay_token');
    
    if (storedUser && token) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        // Socket connection
        import('../services/socket').then(({ default: socket }) => {
          socket.connect();
          socket.emit('register', { userId: userData.id, role: userData.role });
        });
      } catch (e) {
        localStorage.removeItem('empay_user');
        localStorage.removeItem('empay_token');
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('empay_token', token);
    localStorage.setItem('empay_user', JSON.stringify(userData));
    setUser(userData);
    // Socket connection
    import('../services/socket').then(({ default: socket }) => {
      socket.connect();
      socket.emit('register', { userId: userData.id, role: userData.role });
    });
  };

  const logout = () => {
    import('../services/socket').then(({ default: socket }) => {
      socket.disconnect();
    });
    localStorage.removeItem('empay_token');
    localStorage.removeItem('empay_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
