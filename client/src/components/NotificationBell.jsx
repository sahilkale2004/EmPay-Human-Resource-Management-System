import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, User, CheckCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
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

  // Load from API
  useEffect(() => {
    if (!user?.id || !isAdminOrHR) return;
    
    const fetchNotifications = async () => {
      try {
        const res = await api.get('notifications');
        if (res.data.success) {
          setNotifications(res.data.data || []);
        }
      } catch (e) {
        console.error('Failed to fetch notifications', e);
      }
    };

    fetchNotifications();

    // Socket Listener
    const handleNewNotification = (data) => {
      setNotifications(prev => [data, ...prev]);
      setAnimate(true);
      setTimeout(() => setAnimate(false), 600);
    };

    socket.on('notification_received', handleNewNotification);

    return () => {
      socket.off('notification_received', handleNewNotification);
    };
  }, [user?.id, isAdminOrHR]);

  const unreadCount = notifications.filter(n => !n.is_read || n.is_read === 0 || n.is_read === '0').length;

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const markAllAsRead = async (e) => {
    if (e) e.stopPropagation();
    try {
      await api.put('notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const handleNotificationClick = async (n) => {
    setIsOpen(false);
    if (!n.is_read || n.is_read === 0 || n.is_read === '0') {
      try {
        await api.put(`notifications/${n.id}/read`);
        setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, is_read: 1 } : notif));
      } catch (e) {
        console.error('Failed to mark as read', e);
      }
    }

    if (n.type === 'TIME_OFF_REQUEST') {
      navigate('/timeoff');
    } else if (n.type === 'NEW_EMPLOYEE') {
      navigate(`/employees/${n.related_id}`);
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
            {notifications.some(n => !n.is_read) && (
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
                    (!n.is_read || n.is_read === 0 || n.is_read === '0') && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-4">
                    <div className={clsx(
                       "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                       n.type === 'TIME_OFF_REQUEST' ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                    )}>
                      {n.type === 'TIME_OFF_REQUEST' ? <Clock className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        "text-xs leading-relaxed text-text",
                        (!n.is_read || n.is_read === 0 || n.is_read === '0') ? "font-bold" : "font-medium"
                      )}>
                        {n.message}
                      </p>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">
                        {timeAgo(n.created_at || n.timestamp)}
                      </p>
                    </div>
                  </div>
                  {(!n.is_read || n.is_read === 0 || n.is_read === '0') && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
