import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, User, CheckCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import socket from '../services/socket';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [animate, setAnimate] = useState(false);
  const dropdownRef = useRef(null);

  const isAdminOrHR = ['ADMIN', 'HR_OFFICER'].includes(user?.role);
  const storageKey = `empay_notifications_${user?.id}`;

  // Load from localStorage
  useEffect(() => {
    if (!user?.id) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse notifications', e);
      }
    }
  }, [user?.id, storageKey]);

  // Sync to localStorage
  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, 50)));
  }, [notifications, user?.id, storageKey]);

  useEffect(() => {
    if (!isAdminOrHR) return;

    const handleNewNotification = (data, type) => {
      const newNotif = {
        id: Date.now() + Math.random(),
        ...data,
        type,
        read: false,
        timestamp: data.timestamp || new Date().toISOString(),
      };
      setNotifications(prev => [newNotif, ...prev]);
      setAnimate(true);
      setTimeout(() => setAnimate(false), 600);
    };

    const onNewEmployee = (data) => handleNewNotification(data, 'new_employee');
    const onNewTimeoff = (data) => handleNewNotification(data, 'new_timeoff');

    socket.on('new_employee', onNewEmployee);
    socket.on('new_timeoff_request', onNewTimeoff);

    return () => {
      socket.off('new_employee', onNewEmployee);
      socket.off('new_timeoff_request', onNewTimeoff);
    };
  }, [isAdminOrHR]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Mark all as read when opening
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const markAllAsRead = (e) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (n) => {
    setIsOpen(false);
    if (n.type === 'new_timeoff') {
      navigate('/timeoff');
    } else if (n.type === 'new_employee') {
      navigate(`/employees/${n.employeeId}`);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isAdminOrHR) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-muted hover:text-text transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className={clsx(
            "absolute top-1 right-1 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white",
            animate && "animate-notif-pop"
          )}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface/50">
            <h3 className="text-sm font-bold text-text">Notifications</h3>
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-primary-dark transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>
          <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="px-5 py-12 text-center text-muted text-sm space-y-2">
                <Bell className="w-10 h-10 mx-auto opacity-10" />
                <p className="font-medium italic">All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={clsx(
                    "px-5 py-4 border-b border-border/40 last:border-b-0 hover:bg-surface cursor-pointer transition-colors relative group",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-4">
                    <div className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      n.type === 'new_timeoff' ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                    )}>
                      {n.type === 'new_timeoff' ? <Clock className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        "text-xs leading-relaxed text-text",
                        !n.read ? "font-bold" : "font-medium"
                      )}>
                        {n.message}
                      </p>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">
                        {timeAgo(n.timestamp)}
                      </p>
                    </div>
                  </div>
                  {!n.read && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
