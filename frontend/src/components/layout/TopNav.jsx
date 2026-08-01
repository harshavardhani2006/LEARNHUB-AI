import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Bell, Menu, User as UserIcon, Settings, LogOut, ShieldAlert,
         Heart, Upload, Bot, BookOpen, Loader2, CheckCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Map notification type → icon + colour
const NotifIcon = ({ type }) => {
  const cls = 'w-4 h-4 shrink-0';
  if (type === 'like')         return <Heart     className={`${cls} text-red-500`} />;
  if (type === 'upload')       return <Upload    className={`${cls} text-blue-500`} />;
  if (type === 'chat')         return <Bot       className={`${cls} text-purple-500`} />;
  if (type === 'new_resource') return <BookOpen  className={`${cls} text-emerald-500`} />;
  return <Bell className={`${cls} text-slate-400`} />;
};

// Friendly relative time
const relativeTime = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const TopNav = ({ onMenuClick }) => {
  const { user, profile, emailVerified, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [bellOpen, setBellOpen]           = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading]   = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);

  const dropdownRef = useRef(null);
  const bellRef     = useRef(null);
  const navigate    = useNavigate();

  // Close both dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (bellRef.current     && !bellRef.current.contains(e.target))     setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch notifications when bell opens
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setNotifLoading(true);
    try {
      const res = await api.get(`/users/${user.id}/notifications`);
      const items = res.data.notifications || [];
      setNotifications(items);
      // Count how many are newer than last-seen timestamp stored in localStorage
      const lastSeen = parseInt(localStorage.getItem('notif_last_seen') || '0', 10);
      const unseen = items.filter(n => new Date(n.time).getTime() > lastSeen).length;
      setUnreadCount(unseen);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  }, [user]);

  // Load count on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleBellClick = () => {
    const opening = !bellOpen;
    setBellOpen(opening);
    setDropdownOpen(false);
    if (opening) {
      fetchNotifications();
      // Mark all as seen
      localStorage.setItem('notif_last_seen', Date.now().toString());
      setUnreadCount(0);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/resources?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const getInitial = () => {
    if (profile?.full_name) return profile.full_name.charAt(0).toUpperCase();
    if (user?.email)        return user.email.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <header className="h-[64px] bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">

      {/* Left — menu + search */}
      <div className="flex items-center flex-1">
        <button
          onClick={onMenuClick}
          className="mr-4 lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearch} className="hidden sm:flex items-center flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources, chats (Ctrl+K)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
          />
        </form>
      </div>

      {/* Right — bell + avatar */}
      <div className="flex items-center space-x-3 sm:space-x-4">

        {/* ── Notification Bell ── */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={handleBellClick}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 border-2 border-white rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right z-50">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-heading font-bold text-sm text-slate-900">Notifications</span>
                {notifications.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> All caught up
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-xs font-medium">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={n.link}
                      onClick={() => setBellOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="mt-0.5 p-1.5 bg-slate-100 rounded-lg group-hover:bg-white transition-colors shrink-0">
                        <NotifIcon type={n.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-700 font-medium leading-snug line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{relativeTime(n.time)}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                <Link
                  to="/resources"
                  onClick={() => setBellOpen(false)}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Browse all resources →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Avatar / Profile Dropdown ── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setBellOpen(false); }}
            className="flex items-center space-x-2 focus:outline-none group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-ai-purple flex items-center justify-center text-white font-medium shadow-sm group-hover:shadow-md transition-all">
              {getInitial()}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                {!emailVerified && (
                  <div className="mt-2 flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Unverified</span>
                  </div>
                )}
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <UserIcon className="w-4 h-4 mr-3 text-slate-400" />
                  Profile
                </Link>
                <Link
                  to="/profile?tab=settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-3 text-slate-400" />
                  Settings
                </Link>
              </div>

              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
